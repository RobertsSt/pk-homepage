import type { Locale } from '@/i18n/config';
import type { UiKey } from '@/i18n/ui';
import { dateOf } from './dates';
import type { CalendarEvent } from './types';

type Strings = Record<UiKey, string>;

/** "124 gadi" / "121 gads" / "124 years": Latvian uses the singular after …1, except …11. */
export function formatYears(years: number, locale: Locale): string {
  if (locale === 'en') return `${years} ${years === 1 ? 'year' : 'years'}`;
  const singular = years % 10 === 1 && years % 100 !== 11;
  return `${years} ${singular ? 'gads' : 'gadi'}`;
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
