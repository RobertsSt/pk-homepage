/**
 * Date helpers for the calendar. Everything works on `YYYY-MM-DD` strings in
 * Riga time, so results are the same on the build server and in any browser.
 */
import type { Locale } from '@/i18n/config';

const TIME_ZONE = 'Europe/Riga';

const MONTHS: Record<Locale, readonly string[]> = {
  lv: [
    'janvāris',
    'februāris',
    'marts',
    'aprīlis',
    'maijs',
    'jūnijs',
    'jūlijs',
    'augusts',
    'septembris',
    'oktobris',
    'novembris',
    'decembris',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

const MONTHS_SHORT: Record<Locale, readonly string[]> = {
  lv: ['janv.', 'febr.', 'marts', 'apr.', 'maijs', 'jūn.', 'jūl.', 'aug.', 'sept.', 'okt.', 'nov.', 'dec.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** Monday first, as calendars are printed in Latvia. */
const WEEKDAYS: Record<Locale, readonly string[]> = {
  lv: ['Pr', 'Ot', 'Tr', 'Ce', 'Pk', 'Se', 'Sv'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

const WEEKDAYS_LONG: Record<Locale, readonly string[]> = {
  lv: ['pirmdiena', 'otrdiena', 'trešdiena', 'ceturtdiena', 'piektdiena', 'sestdiena', 'svētdiena'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};

export interface YearMonth {
  year: number;
  /** 1–12 */
  month: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

export const toDateKey = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;

export const dateOf = (dateTime: string) => dateTime.slice(0, 10);

export const timeOf = (dateTime: string) => (dateTime.length > 10 ? dateTime.slice(11, 16) : undefined);

function parts(dateKey: string) {
  const [year = 0, month = 1, day = 1] = dateKey.split('-').map(Number);
  return { year, month, day };
}

/** Today's date in Riga, whatever the clock of the machine running this. */
export function todayInRiga(now = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: TIME_ZONE }).format(now);
}

export function addDays(dateKey: string, days: number): string {
  const { year, month, day } = parts(dateKey);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday */
export function weekdayIndex(dateKey: string): number {
  const { year, month, day } = parts(dateKey);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

export const monthOf = (dateKey: string): YearMonth => {
  const { year, month } = parts(dateKey);
  return { year, month };
};

export function shiftMonth({ year, month }: YearMonth, by: number): YearMonth {
  const index = year * 12 + (month - 1) + by;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** The weeks a month view shows, each seven date keys, padded with neighbouring days. */
export function monthGrid({ year, month }: YearMonth): string[][] {
  const first = toDateKey(year, month, 1);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const start = addDays(first, -weekdayIndex(first));
  const weekCount = Math.ceil((weekdayIndex(first) + daysInMonth) / 7);
  return Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)),
  );
}

export const dayNumber = (dateKey: string) => parts(dateKey).day;

export const monthName = (locale: Locale, month: number) => MONTHS[locale][month - 1]!;

export const monthShort = (locale: Locale, dateKey: string) =>
  MONTHS_SHORT[locale][parts(dateKey).month - 1]!;

export const weekdayNames = (locale: Locale) => WEEKDAYS[locale];

export const weekdayLong = (locale: Locale, dateKey: string) => WEEKDAYS_LONG[locale][weekdayIndex(dateKey)]!;

/** "2026. gada oktobris" / "October 2026" */
export function monthTitle(locale: Locale, { year, month }: YearMonth): string {
  const name = monthName(locale, month);
  return locale === 'lv' ? `${year}. gada ${name}` : `${name} ${year}`;
}

/** "otrdiena, 6. oktobris" / "Tuesday 6 October" */
export function longDate(locale: Locale, dateKey: string): string {
  const { month, day } = parts(dateKey);
  const weekday = weekdayLong(locale, dateKey);
  return locale === 'lv'
    ? `${weekday}, ${day}. ${monthName(locale, month)}`
    : `${weekday} ${day} ${monthName(locale, month)}`;
}
