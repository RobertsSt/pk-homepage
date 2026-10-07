import type { Locale } from '@/i18n/config';
import { localizedUrl } from '@/i18n/urls';

/** The address segment shared by the fraternity list and every fraternity page. */
export const FRATERNITIES_SLUG = 'studentu-korporacijas';

export const homeUrl = (locale: Locale) => localizedUrl(locale);

/** A text page, by its file name in `src/content/pages`. */
export const pageUrl = (locale: Locale, slug: string) => localizedUrl(locale, slug);

export const fraternitiesUrl = (locale: Locale) => localizedUrl(locale, FRATERNITIES_SLUG);

export const fraternityUrl = (locale: Locale, id: string) =>
  localizedUrl(locale, `${FRATERNITIES_SLUG}/${id}`);

/**
 * Give a fraternity's shield this view-transition-name on two pages and the
 * browser moves it from one to the other. Use it once per page at most.
 */
export const shieldTransitionName = (id: string) => `shield-${id}`;

export const CREDITS_SLUG = 'attelu-avoti';

export const creditsUrl = (locale: Locale) => localizedUrl(locale, CREDITS_SLUG);
