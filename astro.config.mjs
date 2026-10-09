// @ts-check
import { readdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
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
// redirect page, which any static host can serve; on the hosting itself the
// server rules below answer first, with a proper "moved permanently".
//
// The old homepage, /WordPress/, is the one exception: it is a page of its own
// (src/pages/WordPress), because forwarding it would trap returning visitors
// in a circle. Do not add it here.
const redirects = {
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
/**
 * Rules for the Apache server of the hosting, written into the site's folder
 * as `.htaccess`. A host that is not Apache (the preview) ignores the file.
 * @param {string} host
 */
const serverRules = (host) => `# Written by the build (astro.config.mjs). A change made on the server is
# overwritten by the next upload; change it there instead.

# The site's own "page not found" page instead of the hosting's.
ErrorDocument 404 ${base}404.html

<IfModule mod_rewrite.c>
  RewriteEngine On

  # The addresses of the WordPress site this one replaced: each is moved for
  # good to the page that took its place, whatever was written after a "?".
${Object.entries(redirects)
  .map(([from, target]) => `  RewriteRule ^${from.slice(1)}/?$ https://${host}${target} [R=301,L,QSD]`)
  .join('\n')}

  # One address for every page: https://${host}. A request over plain http, or
  # for www.${host} or another name the hosting answers to, is sent there. The
  # folder .well-known is left alone: the hosting uses it to renew the
  # certificate.
  RewriteCond %{REQUEST_URI} !^/\\.well-known/
  RewriteCond %{HTTPS} !=on [OR]
  RewriteCond %{HTTP_HOST} !^${host.replaceAll('.', '\\.')}(:\\d+)?$ [NC]
  RewriteRule ^ https://${host}%{REQUEST_URI} [R=301,L]
</IfModule>
`;

/**
 * Two files that sit beside the pages and depend on the address the site is
 * built for, so they are written after each build: the server rules above, and
 * robots.txt, which tells search engines where the list of pages is.
 * @type {import('astro').AstroIntegration}
 */
const hostFiles = {
  name: 'host-files',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      const sitemapUrl = new URL(`${base}sitemap-index.xml`, site);
      await writeFile(new URL('.htaccess', dir), serverRules(new URL(site).host));
      await writeFile(new URL('robots.txt', dir), `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`);
    },
  },
};

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
      // The old homepage address shows the homepage; search engines are given the real one.
      filter: (page) => !page.includes('/WordPress/'),
    }),
    hostFiles,
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
