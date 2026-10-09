import type { Locale } from '@/i18n/config';
import type { UiKey } from '@/i18n/ui';
import { dateOf, timeOf } from './dates.ts';
import type { CalendarEvent } from './types';

type Strings = Record<UiKey, string>;

/** "124 gadi" / "121 gads" / "124 years": Latvian uses the singular after …1, except …11. */
export function formatYears(years: number, locale: Locale): string {
  if (locale === 'en') return `${years} ${years === 1 ? 'year' : 'years'}`;
  const singular = years % 10 === 1 && years % 100 !== 11;
  return `${years} ${singular ? 'gads' : 'gadi'}`;
}

/** "3 notikumi" / "21 notikums" / "3 events", by the same rule as the years. */
export function formatEventCount(count: number, locale: Locale): string {
  if (locale === 'en') return `${count} ${count === 1 ? 'event' : 'events'}`;
  const singular = count % 10 === 1 && count % 100 !== 11;
  return `${count} ${singular ? 'notikums' : 'notikumi'}`;
}

/** "19:00–22:00", or the start alone when the event does not end on the same day. */
export function timeRange(event: Pick<CalendarEvent, 'start' | 'end'>): string | undefined {
  const start = timeOf(event.start);
  if (!start) return undefined;
  const end = event.end && dateOf(event.end) === dateOf(event.start) ? timeOf(event.end) : undefined;
  return end ? `${start}–${end}` : start;
}

const NOT_A_PLACE =
  /^(LV[-–]?\s?\d{4}|Latvija|Latvijas Republika|Latvia)$|\b(rajons|priekšpilsēta|district)$/i;

/**
 * A place short enough for one line: Google writes out the district, the
 * postcode and the country, which nobody needs to find the door.
 * "Šarlotes iela 3, Centra rajons, Rīga, LV-1001, Latvija" → "Šarlotes iela 3, Rīga"
 */
export function placeName(location: string | undefined): string | undefined {
  const parts = (location ?? '')
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter((part) => part && !NOT_A_PLACE.test(part));
  return parts.slice(0, 3).join(', ') || undefined;
}

/**
 * The title to show for an event. Calendar entries are written in Latvian;
 * the two recurring kinds are recognised and worded per language, anything
 * else is shown as written.
 */
export function eventTitle(event: CalendarEvent, locale: Locale, strings: Strings): string {
  if (event.kind === 'meeting') return strings['calendar.meeting'];
  if (event.kind === 'anniversary' && event.subject && event.foundedYear) {
    const age = Number(dateOf(event.start).slice(0, 4)) - event.foundedYear;
    return strings['calendar.anniversary']
      .replace('{name}', event.subject)
      .replace('{years}', formatYears(age, locale));
  }
  return event.title;
}
