// @ts-check
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// The same code builds for pk.lv (served from the domain root) and for a
// preview hosted under a sub-path; the two differ only in these variables.
const site = process.env.SITE_URL ?? 'https://pk.lv';
const base = process.env.BASE_PATH ?? '/';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  i18n: {
    locales: ['lv', 'en'],
    defaultLocale: 'lv',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    react(),
    sitemap({
      i18n: { defaultLocale: 'lv', locales: { lv: 'lv-LV', en: 'en' } },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
