import { getRelativeLocaleUrl } from 'astro:i18n';
import type { Locale } from './config';

/**
 * A link to a page of this site in the given language. Always build internal
 * links through this, so they keep working when the site is served from a
 * sub-path (the preview) instead of the domain root.
 */
export function localizedUrl(locale: Locale, path = ''): string {
  return getRelativeLocaleUrl(locale, path);
}
