/**
 * Links that lead from one calendar entry to a map and to the visitor's own
 * calendar. Safe to use in the browser: nothing here reads the feed.
 */
import { addDays, dateOf, timeOf } from './dates.ts';
import type { CalendarEvent } from './types';

/** Opens the place in Google Maps, searched for as it is written in the calendar. */
export const mapUrl = (location: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.replace(/\s+/g, ' ').trim())}`;

const compact = (dateTime: string) => dateTime.replace(/[-:]/g, '');

/** An hour after a wall-clock time, for an entry that names no end. */
function hourLater(dateTime: string): string {
  const [hour = 0, minute = 0] = timeOf(dateTime)!.split(':').map(Number);
  const next = hour + 1;
  const day = next > 23 ? addDays(dateOf(dateTime), 1) : dateOf(dateTime);
  return `${day}T${String(next % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Opens Google Calendar with a copy of this one entry, ready to be saved.
 * Times are Riga wall-clock times and are sent as such.
 */
export function addToGoogleUrl(event: CalendarEvent): string {
  const dates = event.allDay
    ? // Google counts an all-day entry up to, not including, its last date.
      `${compact(event.start)}/${compact(addDays(dateOf(event.end ?? event.start), 1))}`
    : `${compact(event.start)}00/${compact(event.end ?? hourLater(event.start))}00`;
  const query = new URLSearchParams({ action: 'TEMPLATE', text: event.title, dates, ctz: 'Europe/Riga' });
  if (event.location) query.set('location', event.location);
  if (event.description) query.set('details', event.description);
  return `https://calendar.google.com/calendar/render?${query}`;
}
