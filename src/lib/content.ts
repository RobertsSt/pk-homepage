import { getCollection, getEntry } from 'astro:content';
import { navigation, type NavGroup, type NavLink } from '@/data/navigation';
import { defaultLocale, type Locale } from '@/i18n/config';
import type { HistorySlug } from './history';

/** Slugs of every text page. The Latvian set decides which pages exist. */
export async function getTextPageSlugs(): Promise<string[]> {
  const pages = await getCollection('pages', ({ id }) => id.startsWith(`${defaultLocale}/`));
  return pages.map((page) => page.id.slice(defaultLocale.length + 1));
}

/** The two histories are told as stories; see `src/content/histories`. */
const HISTORY_SLUGS: readonly HistorySlug[] = ['pk-vesture', 'vesture'];

/**
 * One route per text page, with the kind of page it is: a history told in
 * chapters, a guide in short sections, or the text as it was written.
 */
export async function getTextPagePaths() {
  const guides = new Set((await getCollection('guides')).map((guide) => guide.id));
  return (await getTextPageSlugs()).map((slug) => {
    const history = HISTORY_SLUGS.find((name) => name === slug);
    const props = history
      ? ({ kind: 'history', slug: history } as const)
      : ({ kind: guides.has(slug) ? 'guide' : 'text', slug } as const);
    return { params: { slug }, props };
  });
}

/** A text page in the wanted language, or the Latvian one while it awaits translation. */
export async function getTextPage(locale: Locale, slug: string) {
  const own = await getEntry('pages', `${locale}/${slug}`);
  const entry = own ?? (await getEntry('pages', `${defaultLocale}/${slug}`));
  if (!entry) throw new Error(`There is no text page "${slug}"`);
  return { entry, translated: Boolean(own) };
}

/** The long text about a fraternity, with the same fallback to Latvian. */
export async function getFraternityText(locale: Locale, id: string) {
  const own = await getEntry('fraternityTexts', `${locale}/${id}`);
  const entry = own ?? (await getEntry('fraternityTexts', `${defaultLocale}/${id}`));
  return { entry, translated: Boolean(own) };
}

/** Where a page sits in the main menu, if it is listed there. */
export function findInNavigation(slug: string): { group: NavGroup; link: NavLink } | undefined {
  for (const group of navigation) {
    const link = group.links.find((candidate) => candidate.page === slug);
    if (link) return { group, link };
  }
  return undefined;
}
