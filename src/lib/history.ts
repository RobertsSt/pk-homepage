import { getEntry } from 'astro:content';
import type { Locale } from '@/i18n/config';

export type HistorySlug = 'pk-vesture' | 'vesture';

export async function loadHistory(locale: Locale, slug: HistorySlug) {
  const entry = await getEntry('histories', slug);
  if (!entry) throw new Error(`Missing history: ${slug}`);
  const story = entry.data;
  return {
    title: story.title[locale],
    kicker: story.kicker[locale],
    intro: story.intro[locale],
    range: story.range[locale],
    chapters: story.chapters.map((chapter) => ({
      id: chapter.id,
      year: chapter.year[locale],
      title: chapter.title[locale],
      summary: chapter.summary[locale],
      paragraphs: chapter.paragraphs[locale],
    })),
    terms: story.terms.map((term) => ({ word: term.word, text: term.text[locale] })),
  };
}

export const historyLabels = {
  lv: {
    explore: 'Pieturas vēsturē',
    select: 'Izvēlies gadu un iepazīsti stāstu',
    previous: 'Iepriekšējais posms',
    next: 'Nākamais posms',
    readChapter: 'Lasīt šo nodaļu',
    begin: 'Sākt lasīt',
    chapters: 'Šajā stāstā',
    chapter: 'Nodaļa',
    founders: 'Piecas dibinātājas',
    members: 'Iepazīsti korporācijas',
    terms: 'Vārdi ar vēsturi',
    termsHint: 'Atver jēdzienu un uzzini vairāk.',
    archive: 'Vēlies iedziļināties?',
    archiveHint: 'Pilnais vēsturiskais teksts ar notikumiem, personām un detaļām.',
    fullText: 'Lasīt pilno vēstures tekstu',
    related: 'Stāsts turpinās',
    pkTitle: 'Kā radās Prezidiju Konvents?',
    pkText: 'No piecu korporāciju tikšanās 1919. gadā līdz kopdarbībai šodien.',
    rootsTitle: 'Kur sākās korporāciju tradīcijas?',
    rootsText: 'Iepazīsti ceļu no Eiropas universitātēm līdz latviešu korporācijām.',
    back: 'Uz sākumu',
    photoPk: 'Selonijas biedri. Vēsturiska fotogrāfija.',
    photoRoots: 'Beveronijas biedri. Vēsturiska fotogrāfija.',
    photoAltPk: 'Vēsturiska melnbalta kopbilde: Selonijas biedri deķeļos divstāvu nama priekšā.',
    photoAltRoots: 'Vēsturiska Beveronijas biedru kopbilde deķeļos un krāsu lentēs.',
    photoHome: 'Korporāciju vēsture ir arī cilvēku stāsts. Selonijas biedru vēsturiska kopbilde.',
    discover: 'Iepazīt visu stāstu',
  },
  en: {
    explore: 'Moments in history',
    select: 'Choose a year and discover the story',
    previous: 'Previous period',
    next: 'Next period',
    readChapter: 'Read this chapter',
    begin: 'Start reading',
    chapters: 'In this story',
    chapter: 'Chapter',
    founders: 'The five founders',
    members: 'Explore the fraternities',
    terms: 'Words with a history',
    termsHint: 'Open a term to discover more.',
    archive: 'Curious to go deeper?',
    archiveHint: 'The complete historical text, with events, people and details.',
    fullText: 'Read the full history',
    related: 'The story continues',
    pkTitle: 'How did the Presidium Convent begin?',
    pkText: 'From a meeting of five fraternities in 1919 to cooperation today.',
    rootsTitle: 'Where did fraternity traditions begin?',
    rootsText: 'Follow the journey from Europe’s universities to Latvian fraternities.',
    back: 'Back to top',
    photoPk: 'Members of Selonija. Historical photograph.',
    photoRoots: 'Members of Beveronija. Historical photograph.',
    photoAltPk:
      'Historical black-and-white group photograph of Selonija members in caps in front of a two-storey house.',
    photoAltRoots: 'Historical group photograph of Beveronija members wearing caps and colour sashes.',
    photoHome:
      'Fraternity history is also a story of people. A historical group photograph of Selonija members.',
    discover: 'Discover the full story',
  },
} as const;
