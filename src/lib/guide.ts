import { getEntry } from 'astro:content';
import type { Locale } from '@/i18n/config';
import { inLanguage } from './localize';

/** A guide page's sections with their text in one language. */
export async function loadGuide(locale: Locale, slug: string) {
  const entry = await getEntry('guides', slug);
  if (!entry) throw new Error(`There is no guide "${slug}" in src/content/guides`);
  return inLanguage(entry.data, locale);
}

export type Guide = Awaited<ReturnType<typeof loadGuide>>;
