// @ts-check
import { readdirSync } from 'node:fs';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, sharpImageService } from 'astro/config';

// The same code builds for pk.lv (served from the domain root) and for a
// preview hosted under a sub-path; the two differ only in these variables.
const site = process.env.SITE_URL ?? 'https://pk.lv';
const base = process.env.BASE_PATH ?? '/';

/**
 * File names in a content folder, without their extension.
 * @param {string} folder
 * @param {string} extension
 */
const contentNames = (folder, extension) =>
  readdirSync(new URL(folder, import.meta.url))
    .filter((file) => file.endsWith(extension))
    .map((file) => file.slice(0, -extension.length));

/**
 * A destination inside this site. Astro does not add the base path to
 * redirect targets itself.
 * @param {string} path
 */
const to = (path) => `${base.replace(/\/$/, '')}${path}`;

// Every address of the old WordPress site leads to its new home, so existing
// links and search results keep working. The build writes each one as a small
// redirect page, which any static host can serve.
const redirects = {
  '/WordPress': to('/'),
  '/WordPress/studentu-korporacijas': to('/studentu-korporacijas/'),
  ...Object.fromEntries(
    contentNames('./src/content/pages/lv/', '.md').map((slug) => [`/WordPress/${slug}`, to(`/${slug}/`)]),
  ),
  ...Object.fromEntries(
    contentNames('./src/content/fraternities/', '.yaml').map((id) => [
      `/WordPress/${id}`,
      to(`/studentu-korporacijas/${id}/`),
    ]),
  ),
  // Copies left over from earlier page layouts, which search engines may still list.
  '/WordPress/selonija-3': to('/studentu-korporacijas/selonija/'),
  '/WordPress/ventonia3': to('/studentu-korporacijas/ventonia/'),
  '/WordPress/fraternitas-lettica-2': to('/studentu-korporacijas/fraternitas-lettica/'),
};

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  redirects,
  i18n: {
    locales: ['lv', 'en'],
    defaultLocale: 'lv',
    routing: { prefixDefaultLocale: false },
  },
  image: {
    // Transparent images (the crest above all) may lose a little precision in
    // their transparency; left exact, the crest alone weighs twice as much.
    service: sharpImageService({ webp: { alphaQuality: 50 } }),
  },
  integrations: [
    preact(),
    sitemap({
      i18n: { defaultLocale: 'lv', locales: { lv: 'lv-LV', en: 'en' } },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
