import type { Localized } from '@/i18n/config';

export interface NavLink {
  label: Localized;
  /** File name of the page in src/content/pages, or a fixed route. */
  page: string;
}

export interface NavGroup {
  label: Localized;
  links: NavLink[];
}

/** The main menu, in the order and wording of the current site. */
export const navigation: NavGroup[] = [
  {
    label: { lv: 'Prezidiju Konvents', en: 'Presidium Convent' },
    links: [
      { label: { lv: 'P!K! vēsture', en: 'History of P!K!' }, page: 'pk-vesture' },
      { label: { lv: 'P!K! mērķi', en: 'Aims of P!K!' }, page: 'pk-merki' },
      { label: { lv: 'Rekvizīti', en: 'Legal details' }, page: 'rekviziti' },
    ],
  },
  {
    label: { lv: 'Studentu korporācijas', en: 'Student fraternities' },
    links: [
      { label: { lv: 'Studentu korporācijas', en: 'The fraternities' }, page: 'studentu-korporacijas' },
      {
        label: { lv: 'Kas ir studentu korporācijas?', en: 'What is a student fraternity?' },
        page: 'kas-ir-studentu-korporacijas',
      },
      { label: { lv: 'Vēsture', en: 'History' }, page: 'vesture' },
      { label: { lv: 'A!K!K!', en: 'A!K!K!' }, page: 'akk' },
    ],
  },
  {
    label: { lv: 'Aktivitātes', en: 'Activities' },
    links: [
      {
        label: { lv: 'Baltijas tautu komeršs', en: 'Baltic Nations’ Commers' },
        page: 'baltijas-tautu-komerss',
      },
      { label: { lv: 'P!K! vīru koris', en: 'P!K! Men’s Choir' }, page: 'pk-viru-koris' },
    ],
  },
  {
    label: { lv: 'Citi', en: 'More' },
    links: [
      {
        label: { lv: 'Latvijas korporāciju apvienība', en: 'Association of Latvian Fraternities' },
        page: 'latvijas-korporaciju-apvieniba',
      },
      {
        label: { lv: 'Studentu atbalsta fondi', en: 'Student support funds' },
        page: 'studentu-atbalsta-fondi',
      },
    ],
  },
];
