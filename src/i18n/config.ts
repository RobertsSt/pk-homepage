export const locales = ['lv', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'lv';

/** Names shown in the language switch, each in its own language. */
export const localeNames: Record<Locale, string> = {
  lv: 'Latviešu',
  en: 'English',
};

export function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}

/** Astro reports `undefined` for routes outside any locale folder. */
export function resolveLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export type Localized<T = string> = Record<Locale, T>;
