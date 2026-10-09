import type { Locale } from '@/i18n/config';

/** The same data with every `{ lv, en }` pair replaced by the text in one language. */
export type InLanguage<T> = T extends { lv: infer Text; en: unknown }
  ? Text
  : T extends readonly (infer Item)[]
    ? InLanguage<Item>[]
    : T extends object
      ? { [Key in keyof T]: InLanguage<T[Key]> }
      : T;

const isPair = (value: Record<string, unknown>) =>
  Object.keys(value).length === 2 && typeof value.lv === 'string' && typeof value.en === 'string';

/** A picture as the content collections hand it over; it is passed on untouched. */
const isPicture = (value: Record<string, unknown>) => 'src' in value && 'width' in value && 'format' in value;

/**
 * Picks one language throughout a piece of content: every `{ lv, en }` pair,
 * however deep, becomes the text in `locale`. Everything else stays as it is.
 */
export function inLanguage<T>(value: T, locale: Locale): InLanguage<T> {
  if (Array.isArray(value)) return value.map((item) => inLanguage(item, locale)) as InLanguage<T>;
  if (value === null || typeof value !== 'object' || value instanceof Date) return value as InLanguage<T>;
  const record = value as Record<string, unknown>;
  if (isPair(record)) return record[locale] as InLanguage<T>;
  if (isPicture(record)) return value as InLanguage<T>;
  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [key, inLanguage(item, locale)]),
  ) as InLanguage<T>;
}
