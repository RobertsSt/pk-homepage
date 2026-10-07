import type { Locale } from './config';

/** Interface text. Page content lives in src/content, not here. */
const ui = {
  lv: {
    'site.name': 'Prezidiju Konvents',
    'site.title': 'P!K! — Prezidiju Konvents',
    'site.description':
      'Prezidiju Konvents (P!K!) apvieno Latvijas studentu korporācijas. Korporācijas, vēsture, kalendārs un kontakti.',
    'nav.menu': 'Izvēlne',
    'nav.close': 'Aizvērt',
    'nav.skip': 'Pāriet uz saturu',
    'nav.home': 'Sākums',
    'nav.language': 'Valoda',
    'hero.since': 'Dibināts {year}. gadā',
    'hero.fraternities': 'Korporācijas',
    'hero.calendar': 'Kalendārs',
    'stats.fraternities': 'studentu korporācijas P!K! sastāvā',
    'stats.founded': 'Prezidiju Konvents dibināts pie Latvijas Universitātes',
    'stats.presiding': 'prezidējošais konvents {term} akadēmiskajā gadā',
    'about.kicker': 'Par mums',
    'about.title': 'Par Prezidiju Konventu',
    'about.aims': 'P!K! mērķi',
    'fraternities.kicker': 'P!K! sastāvā',
    'fraternities.title': 'Studentu korporācijas',
    'fraternities.intro': 'Divdesmit korporācijas, senioritātes secībā.',
    'fraternities.all': 'Visas korporācijas',
    'fraternities.founded': 'dib. {year}',
    'fraternities.outside': 'Ārpus P!K!',
    'officers.kicker': 'Prezidijs {term}',
    'officers.title': 'P!K! amatpersonas',
    'history.kicker': 'Kopš 1919',
    'history.title': 'Vēsture',
    'history.more': 'Lasīt vairāk',
    'history.today': 'Šodien',
    'history.todayText': '{count} korporācijas P!K! sastāvā.',
    'calendar.kicker': 'Notikumi',
    'calendar.title': 'Kalendārs',
    'calendar.upcoming': 'Tuvākie notikumi',
    'calendar.empty': 'Šajā dienā notikumu nav.',
    'calendar.none': 'Tuvākajā laikā notikumu nav.',
    'calendar.today': 'Šodien',
    'calendar.previous': 'Iepriekšējais mēnesis',
    'calendar.next': 'Nākamais mēnesis',
    'calendar.allDay': 'Visa diena',
    'calendar.subscribe': 'Pievienot savam kalendāram',
    'calendar.meeting': 'P!K! sēde',
    'calendar.anniversary': '{name} — {years}',
    'contact.kicker': 'Sazinies',
    'contact.title': 'Kontakti',
    'contact.email': 'E-pasts',
    'contact.registration': 'Reģ. Nr.',
    'footer.rights': 'Visas tiesības aizsargātas.',
  },
  en: {
    'site.name': 'Presidium Convent',
    'site.title': 'P!K! — Presidium Convent',
    'site.description':
      "The Presidium Convent (P!K!) unites Latvia's student fraternities. Fraternities, history, calendar and contacts.",
    'nav.menu': 'Menu',
    'nav.close': 'Close',
    'nav.skip': 'Skip to content',
    'nav.home': 'Home',
    'nav.language': 'Language',
    'hero.since': 'Founded in {year}',
    'hero.fraternities': 'Fraternities',
    'hero.calendar': 'Calendar',
    'stats.fraternities': 'student fraternities in P!K!',
    'stats.founded': 'the Presidium Convent founded at the University of Latvia',
    'stats.presiding': 'presiding fraternity, academic year {term}',
    'about.kicker': 'About',
    'about.title': 'About the Presidium Convent',
    'about.aims': 'Aims of P!K!',
    'fraternities.kicker': 'Members of P!K!',
    'fraternities.title': 'Student fraternities',
    'fraternities.intro': 'Twenty fraternities, in order of seniority.',
    'fraternities.all': 'All fraternities',
    'fraternities.founded': 'est. {year}',
    'fraternities.outside': 'Outside P!K!',
    'officers.kicker': 'Presidium {term}',
    'officers.title': 'Officers of P!K!',
    'history.kicker': 'Since 1919',
    'history.title': 'History',
    'history.more': 'Read more',
    'history.today': 'Today',
    'history.todayText': '{count} fraternities in P!K!.',
    'calendar.kicker': 'Events',
    'calendar.title': 'Calendar',
    'calendar.upcoming': 'Upcoming events',
    'calendar.empty': 'No events on this day.',
    'calendar.none': 'No upcoming events.',
    'calendar.today': 'Today',
    'calendar.previous': 'Previous month',
    'calendar.next': 'Next month',
    'calendar.allDay': 'All day',
    'calendar.subscribe': 'Add to my calendar',
    'calendar.meeting': 'P!K! meeting',
    'calendar.anniversary': '{name} — {years}',
    'contact.kicker': 'Get in touch',
    'contact.title': 'Contact',
    'contact.email': 'Email',
    'contact.registration': 'Reg. No.',
    'footer.rights': 'All rights reserved.',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof (typeof ui)['lv'];

export type Translate = (key: UiKey, values?: Record<string, string | number>) => string;

/** Returns a lookup for one language; `{name}` placeholders are filled from `values`. */
export function useTranslations(locale: Locale): Translate {
  return (key, values = {}) =>
    ui[locale][key].replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
}

/** The plain string table, for handing to client-side components. */
export function getUiStrings(locale: Locale): Record<UiKey, string> {
  return ui[locale];
}
