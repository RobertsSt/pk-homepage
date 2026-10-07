export type EventKind = 'meeting' | 'anniversary' | 'event';

/**
 * One occurrence of a calendar entry, already expanded from any repeat rule.
 * Dates are wall-clock time in Riga: `YYYY-MM-DD` for all-day entries,
 * `YYYY-MM-DDTHH:mm` otherwise. Plain strings sort and compare correctly.
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  /** Last day (all-day) or end time; absent when it adds nothing to `start`. */
  end?: string;
  allDay: boolean;
  location?: string;
  kind: EventKind;
  /** Anniversaries only: whose founding day it is. */
  subject?: string;
  foundedYear?: number;
  /** Set when the subject is one of the fraternities on this site. */
  fraternityId?: string;
}
