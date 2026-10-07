import type { Locale } from '@/i18n/config';

/** Latvian puts the month of a full date in the locative: "7. novembrī". */
const MONTHS_LV = [
  'janvārī',
  'februārī',
  'martā',
  'aprīlī',
  'maijā',
  'jūnijā',
  'jūlijā',
  'augustā',
  'septembrī',
  'oktobrī',
  'novembrī',
  'decembrī',
];

const MONTHS_EN = [
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
];

/** "1880. gada 7. novembrī" / "7 November 1880". Content dates are stored as UTC days. */
export function formatDate(locale: Locale, date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  return locale === 'lv' ? `${year}. gada ${day}. ${MONTHS_LV[month]}` : `${day} ${MONTHS_EN[month]} ${year}`;
}

/** The opening of a Markdown text as plain words, for a page description. */
export function excerpt(markdown: string, maxLength = 155): string {
  const text = markdown
    .replace(/^#+ .*$/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`\\>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

/** "https://www.lettonia.lv/" → "lettonia.lv" */
export const displayHost = (url: string) => new URL(url).host.replace(/^www\./, '');
