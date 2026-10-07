import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i);

/** A string that exists in both site languages. */
const localized = z.object({ lv: z.string(), en: z.string() });

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
      mottos: z.array(z.string()).default([]),
      website: z.url().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.email().optional(),
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
    }),
});

/** Long-form text per fraternity and language: `lv/lettonia`, `en/lettonia`. */
const fraternityTexts = defineCollection({
  loader: glob({ base: './src/content/fraternity-texts', pattern: '{lv,en}/*.md' }),
  schema: z.object({
    wpModified: z.coerce.date().optional(),
  }),
});

/** Plain text pages per language: `lv/pk-vesture`, `en/pk-vesture`. */
const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '{lv,en}/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    wpModified: z.coerce.date().optional(),
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
      }),
      officers: z.array(
        z.object({
          name: z.string(),
          honorific: z.string(),
          role: localized,
          email: z.email(),
          photo: image(),
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

export const collections = { fraternities, fraternityTexts, pages, home };
