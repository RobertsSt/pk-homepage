import { defineCollection, reference, type ImageFunction } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { readableOnPaper } from './lib/contrast';

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i);

/** The colour of links, labels and markers: it has to be dark enough to read on the paper. */
const accentColor = hexColor.refine(readableOnPaper, {
  error:
    'is too pale to read on the page. Choose a darker colour of the presiding fraternity, or a deeper shade of one',
});

/** A string that exists in both site languages. */
const localized = z.object({ lv: z.string(), en: z.string() });

/**
 * On an English text: the `wpModified` of the Latvian text it was translated
 * from. When the Latvian text has changed since, the import reports it.
 */
const translatedFrom = z.coerce.date();

/** A photograph with the words that stand in for it when it cannot be seen. */
const photo = (image: ImageFunction) => z.object({ src: image(), alt: localized });

/*
 * Content is also edited through forms (the editing tool), and a form saves a
 * field that was left empty as an empty string, as null, or as an entry with
 * nothing chosen. These helpers read all of those as "not given", so that an
 * empty optional field never fails the build.
 */
const isBlank = (value: unknown) => value === '' || value === null || value === undefined;

/** An optional value; an empty one counts as absent. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (isBlank(value) ? undefined : value), schema.optional());

/** True for a photograph entry in which a picture has been chosen. */
const hasPicture = (value: unknown) =>
  typeof value === 'object' && value !== null && !isBlank((value as { src?: unknown }).src);

/**
 * Language-neutral facts about each fraternity. `order` is seniority, the
 * order the fraternities are traditionally listed in.
 */
const fraternities = defineCollection({
  loader: glob({ base: './src/content/fraternities', pattern: '*.yaml' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      order: z.number().int().positive(),
      membership: z.enum(['pk', 'outside']),
      founded: z.coerce.date(),
      mottos: z.preprocess(
        (value) => (Array.isArray(value) ? value.filter((motto) => !isBlank(motto)) : value),
        z.array(z.string()).default([]),
      ),
      website: optional(z.url()),
      address: optional(z.string()),
      phone: optional(z.string()),
      email: optional(z.email()),
      // Colours read top to bottom on the shield; `band` is the direction
      // the middle stripe runs, left to right.
      colors: z.tuple([hexColor, hexColor, hexColor]),
      band: z.enum(['rising', 'falling']),
      heraldry: z.object({
        shield: image(),
        arms: image(),
        zirkel: image(),
        cap: image(),
        star: image(),
      }),
      /** The photograph that leads the fraternity's page, if there is one. */
      cover: z.preprocess((value) => (hasPicture(value) ? value : undefined), photo(image).optional()),
      /** Further photographs, shown after the text. */
      photos: z.preprocess(
        (value) => (Array.isArray(value) ? value.filter(hasPicture) : value),
        z.array(photo(image)).default([]),
      ),
    }),
});

/** Long-form text per fraternity and language: `lv/lettonia`, `en/lettonia`. */
const fraternityTexts = defineCollection({
  loader: glob({ base: './src/content/fraternity-texts', pattern: '{lv,en}/*.md' }),
  schema: z.object({
    /** The fraternity's name; only shown in the editing tool's list of texts. */
    title: optional(z.string()),
    wpModified: z.coerce.date().optional(),
    translatedFrom: translatedFrom.optional(),
  }),
});

/** Plain text pages per language: `lv/pk-vesture`, `en/pk-vesture`. */
const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '{lv,en}/*.md' }),
  schema: z.object({
    title: z.string(),
    description: optional(z.string()),
    wpModified: z.coerce.date().optional(),
    translatedFrom: translatedFrom.optional(),
  }),
});

/** Homepage content: what changes with each presidium, plus the About photo and history milestones. */
const home = defineCollection({
  loader: glob({ base: './src/content/site', pattern: 'home.yaml' }),
  schema: ({ image }) =>
    z.object({
      name: localized,
      tagline: localized,
      lead: localized,
      intro: localized,
      foundedYear: z.number().int(),
      about: z.object({ photo: image(), alt: localized, caption: localized }),
      presiding: z.object({
        fraternity: reference('fraternities'),
        term: z.string(),
        accent: accentColor,
      }),
      officers: z.array(
        z.object({
          name: z.string(),
          honorific: z.string(),
          role: localized,
          email: z.email(),
          // A new presidium is often announced before its portraits are taken.
          photo: optional(image()),
        }),
      ),
      history: z.object({
        teaser: localized,
        milestones: z.array(z.object({ year: z.string(), text: localized })),
      }),
      contact: z.object({
        email: z.email(),
        legalName: localized,
        registrationNumber: z.string(),
        address: z.string(),
      }),
      calendarId: z.string(),
    }),
});

/** Edited story chapters; the complete imported histories remain in `pages`. */
const histories = defineCollection({
  loader: glob({ base: './src/content/histories', pattern: '*.yaml' }),
  schema: z.object({
    name: z.string(),
    title: localized,
    kicker: localized,
    intro: localized,
    range: localized,
    chapters: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          year: localized,
          title: localized,
          summary: localized,
          paragraphs: z.object({ lv: z.array(z.string()), en: z.array(z.string()) }),
        }),
      )
      .min(1),
    terms: z.array(z.object({ word: z.string(), text: localized })),
  }),
});

/** A heading, a sentence under it and a row of short entries. */
const section = z.object({
  title: localized,
  intro: localized,
  items: z.array(z.object({ title: localized, text: localized })).min(1),
});

/** A photograph with its description and the line printed under it. */
const captioned = (image: ImageFunction) => photo(image).extend({ caption: localized });

/**
 * A page that explains a subject in short sections, written for this site.
 * The complete text imported from WordPress stays in `pages` under the same
 * name and is shown in full at the foot of the page.
 */
const guides = defineCollection({
  loader: glob({ base: './src/content/guides', pattern: '*.yaml' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      title: localized,
      kicker: localized,
      intro: localized,
      photo: captioned(image),
      principles: section,
      character: section,
      path: section,
      joining: z.object({ title: localized, text: localized, sororitiesUrl: z.url() }),
      symbols: section.extend({ example: reference('fraternities') }),
      life: section.extend({ photo: captioned(image) }),
      questions: z.array(z.object({ question: localized, answer: localized })).min(1),
      terms: z.array(z.object({ word: z.string(), text: localized })).min(1),
      sources: z.array(z.object({ title: z.string(), note: localized, url: optional(z.url()) })).min(1),
    }),
});

export const collections = { fraternities, fraternityTexts, pages, home, histories, guides };
