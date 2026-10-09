/**
 * Reads the public Google Calendar at build time and returns plain events.
 * Server-only: nothing here may be imported by a client-side component.
 */
import ICAL from 'ical.js';
import snapshot from '@/data/calendar-snapshot.ics?raw';
import { addDays, todayInRiga } from './dates';
import type { CalendarEvent, EventKind } from './types';

type Time = InstanceType<typeof ICAL.Time>;
type IcalEvent = InstanceType<typeof ICAL.Event>;

const TIME_ZONE = 'Europe/Riga';

/** Occurrences are expanded from the start of last month to this far ahead. */
const DAYS_BACK = 45;
const DAYS_AHEAD = 430;

const ANNIVERSARY = /^(\d{4})\.?\s*(?:g\.|gada)?\s*dibināta\s+(?:studenšu korporācija\s+)?(.+)$/i;
const MEETING = /^P!K!(\s+s[ēe]de)?$/i;

export const feedUrl = (calendarId: string) =>
  `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;

/** Opens the calendar in Google Calendar so a visitor can subscribe to it. */
export const subscribeUrl = (calendarId: string) =>
  `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId)}`;

async function loadFeed(calendarId: string): Promise<string> {
  try {
    const response = await fetch(feedUrl(calendarId), { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!text.includes('BEGIN:VCALENDAR')) throw new Error('response is not an iCalendar feed');
    return text;
  } catch (error) {
    // A build must not fail because Google is briefly unreachable.
    console.warn(`[calendar] Live feed unavailable (${String(error)}); using the saved snapshot.`);
    return snapshot;
  }
}

const rigaFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

function toRiga(time: Time): string {
  if (time.isDate) return `${pad(time.year, 4)}-${pad(time.month)}-${pad(time.day)}`;
  const part = Object.fromEntries(rigaFormat.formatToParts(time.toJSDate()).map((p) => [p.type, p.value]));
  return `${part.year}-${part.month}-${part.day}T${part.hour}:${part.minute}`;
}

function classify(title: string): Pick<CalendarEvent, 'kind' | 'subject' | 'foundedYear'> {
  const anniversary = ANNIVERSARY.exec(title);
  if (anniversary) {
    return { kind: 'anniversary', foundedYear: Number(anniversary[1]), subject: anniversary[2]!.trim() };
  }
  const kind: EventKind = MEETING.test(title) ? 'meeting' : 'event';
  return { kind };
}

/** Google keeps a description as text or as simple HTML; the site shows plain text. */
function plainText(value: string | null | undefined): string | undefined {
  const text = (value ?? '')
    .replace(/<br\s*\/?>|<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text || undefined;
}

function toEvent(
  source: IcalEvent,
  startTime: Time,
  endTime: Time,
  fraternityIds: Map<string, string>,
): CalendarEvent {
  const title = source.summary.trim();
  const start = toRiga(startTime);
  const allDay = startTime.isDate;
  // An all-day entry ends on the morning after its last day.
  const end = allDay ? addDays(toRiga(endTime), -1) : toRiga(endTime);
  const details = classify(title);
  const description = plainText(source.description);
  return {
    id: `${source.uid}:${start}`,
    title,
    start,
    end: end > start ? end : undefined,
    allDay,
    location: source.location?.trim() || undefined,
    // Many entries repeat their title as the description; that says nothing new.
    description: description?.toLowerCase() === title.toLowerCase() ? undefined : description,
    ...details,
    fraternityId: details.subject ? fraternityIds.get(details.subject.toLowerCase()) : undefined,
  };
}

function expand(ics: string, from: string, to: string, fraternityIds: Map<string, string>): CalendarEvent[] {
  const calendar = new ICAL.Component(ICAL.parse(ics));
  for (const zone of calendar.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(zone);

  // A changed single occurrence of a repeating entry arrives as its own
  // component; attach it to its series so the series reports it correctly.
  const series = new Map<string, IcalEvent>();
  const exceptions: IcalEvent[] = [];
  for (const component of calendar.getAllSubcomponents('vevent')) {
    const event = new ICAL.Event(component);
    if (event.isRecurrenceException()) exceptions.push(event);
    else series.set(event.uid, event);
  }
  for (const exception of exceptions) series.get(exception.uid)?.relateException(exception);

  const events: CalendarEvent[] = [];
  const add = (source: IcalEvent, start: Time, end: Time) => {
    const event = toEvent(source, start, end, fraternityIds);
    const lastDay = (event.end ?? event.start).slice(0, 10);
    if (lastDay >= from && event.start.slice(0, 10) <= to) events.push(event);
  };

  for (const event of series.values()) {
    if (!event.isRecurring()) {
      add(event, event.startDate, event.endDate);
      continue;
    }
    const occurrences = event.iterator();
    // The cap only guards against a malformed rule that never ends.
    for (let i = 0; i < 5000; i += 1) {
      const next = occurrences.next();
      if (!next || toRiga(next).slice(0, 10) > to) break;
      const occurrence = event.getOccurrenceDetails(next);
      add(occurrence.item, occurrence.startDate, occurrence.endDate);
    }
  }
  return events.sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}

const cache = new Map<string, Promise<CalendarEvent[]>>();

interface Options {
  calendarId: string;
  /** Lets anniversaries link to the fraternity they belong to. */
  fraternities: { id: string; name: string }[];
}

/** Events from roughly the start of last month to fourteen months ahead, oldest first. */
export function getCalendarEvents({ calendarId, fraternities }: Options): Promise<CalendarEvent[]> {
  let events = cache.get(calendarId);
  if (!events) {
    const today = todayInRiga();
    const ids = new Map(fraternities.map((f) => [f.name.toLowerCase(), f.id]));
    events = loadFeed(calendarId).then((ics) =>
      expand(ics, addDays(today, -DAYS_BACK), addDays(today, DAYS_AHEAD), ids),
    );
    cache.set(calendarId, events);
  }
  return events;
}
