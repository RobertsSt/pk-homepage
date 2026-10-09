import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { Locale } from '@/i18n/config';
import { getUiStrings, useTranslations } from '@/i18n/ui';
import { getCalendarEvents, subscribeUrl } from './calendar/feed';
import type { Band } from './shield';

export type Fraternity = CollectionEntry<'fraternities'>;

/** What a client-side component needs to draw a fraternity's colours. */
export interface FraternityColors {
  name: string;
  colors: readonly [string, string, string];
  band: Band;
}

/** All fraternities in seniority order. */
export async function getFraternities(): Promise<Fraternity[]> {
  const all = await getCollection('fraternities');
  return all.sort((a, b) => a.data.order - b.data.order);
}

/**
 * One route per fraternity. Seniority numbers and the previous/next links run
 * within a group: the members of P!K! first, then the fraternities outside it.
 */
export async function getFraternityPaths() {
  const all = await getFraternities();
  return (['pk', 'outside'] as const).flatMap((membership) => {
    const group = all.filter((f) => f.data.membership === membership);
    return group.map((fraternity, index) => ({
      params: { id: fraternity.id },
      props: { fraternity, position: index + 1, previous: group[index - 1], next: group[index + 1] },
    }));
  });
}

/** The year P!K! was founded, as the homepage states it. */
export async function getFoundedYear() {
  const home = await getEntry('home', 'home');
  if (!home) throw new Error('src/content/site/home.yaml is missing');
  return home.data.foundedYear;
}

/** How to reach P!K!: shown on the homepage and at the foot of every page. */
export async function getContact() {
  const home = await getEntry('home', 'home');
  if (!home) throw new Error('src/content/site/home.yaml is missing');
  return home.data.contact;
}

/** Everything the homepage shows, with text already resolved to one language. */
export async function loadHomepage(locale: Locale) {
  const [homeEntry, fraternities] = await Promise.all([getEntry('home', 'home'), getFraternities()]);
  if (!homeEntry) throw new Error('src/content/site/home.yaml is missing');
  const home = homeEntry.data;

  const presiding = fraternities.find((f) => f.id === home.presiding.fraternity.id);
  if (!presiding)
    throw new Error(`home.yaml names an unknown presiding fraternity: ${home.presiding.fraternity.id}`);

  const events = await getCalendarEvents({
    calendarId: home.calendarId,
    fraternities: fraternities.map((f) => ({ id: f.id, name: f.data.name })),
  });

  const colors: Record<string, FraternityColors> = Object.fromEntries(
    fraternities.map((f) => [f.id, { name: f.data.name, colors: f.data.colors, band: f.data.band }]),
  );

  return {
    locale,
    t: useTranslations(locale),
    strings: getUiStrings(locale),
    name: home.name[locale],
    tagline: home.tagline[locale],
    lead: home.lead[locale],
    intro: home.intro[locale],
    foundedYear: home.foundedYear,
    term: home.presiding.term,
    presiding,
    members: fraternities.filter((f) => f.data.membership === 'pk'),
    outside: fraternities.filter((f) => f.data.membership === 'outside'),
    officers: home.officers.map((officer) => ({ ...officer, role: officer.role[locale] })),
    about: {
      photo: home.about.photo,
      alt: home.about.alt[locale],
      caption: home.about.caption[locale],
    },
    historyTeaser: home.history.teaser[locale],
    milestones: home.history.milestones.map((milestone) => ({
      year: milestone.year,
      text: milestone.text[locale],
    })),
    contact: { ...home.contact, legalName: home.contact.legalName[locale] },
    calendar: { events, colors, subscribeUrl: subscribeUrl(home.calendarId) },
  };
}

export type Homepage = Awaited<ReturnType<typeof loadHomepage>>;
