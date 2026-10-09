# pk-homepage

Static site for P!K! (pk.lv): Astro 7, Tailwind 4, Preact for the calendar only, Latvian and English.
Read [docs/spec.md](docs/spec.md) first: it holds the decisions, the milestones and the open questions.

## Commands

- `npm run verify` runs format check, lint, type check, unit tests, build and browser tests. Run it before
  calling work done. The browser tests need `npx playwright install chromium webkit` once per machine.
- `npm run test:browser` runs only the browser tests, against `dist/`; build first. They start their own
  server on port 4173 and do not touch the dev server.
- CI runs `npm run verify` on every push to any branch, inside the Playwright container image. The image
  tag in `.github/workflows/ci.yml` and `@playwright/test` in `package.json` must be the same version;
  change both together. The repository is public, so a run's result can be read without logging in:
  `https://api.github.com/repos/RobertsSt/pk-homepage/actions/runs?branch=<branch>`.
- Never put anything from the hosting (FTP name, password, folder listing) into the repository. The
  `Deploy` workflow reads them from GitHub secrets; see the comment at its top.
- Everything that passes CI on `main` is published by `Deploy` without anyone pressing a button: a merge,
  an edit saved in the editing tool, the nightly run. Since 2026-10-09 that is pk.lv itself. So `main`
  is the live site; do not merge what is not meant to be seen.
- `.htaccess` and `robots.txt` are written by the build (`astro.config.mjs`), not kept in `public/`,
  because they depend on the address the site is built for. A mistake in the rewrite rules can lock
  visitors in a redirect loop, and there is no trial folder any more: try a change on this machine
  first. macOS has Apache (`/usr/sbin/httpd`), which reads the file when pointed at `dist/` with
  `AllowOverride All`.
- `/WordPress/` is a page on purpose (`src/pages/WordPress`), not a redirect: browsers remember the old
  "pk.lv has moved to /WordPress/" for good, and redirecting it home again traps them in a loop. Never
  point an old address back at an address that used to redirect to it.
- The tab and home-screen icons in `public/` are drawn from the crest by `npm run build:icons`.
- Only one dev server can run per project. If Roberts already has one open (`npx astro dev status`), use
  it at http://localhost:4321 and never stop it. Otherwise `npx astro dev --background` starts one and
  `npx astro dev stop` ends it. `astro preview` also detaches; stop it with `npx astro preview stop`.
- A running dev server can go stale when a build or a schema change happens underneath it: pages error or
  scripts return 504. Saving `astro.config.mjs` restarts it; a real edit to `src/content.config.ts` makes
  it re-read the schema.
- WordPress was removed on 2026-10-09. `scripts/import-wordpress.mjs` and `scripts/import-overrides.json`
  have nothing left to read and are due to be deleted; do not run or extend them. `npm run
check:translations` lists English texts whose Latvian source has changed, by the dates in the files.
- `npm run build:fonts` rebuilds `src/assets/fonts` from the pinned sources. Needed only when the list of
  characters in `scripts/build-fonts.mjs` or the fonts change.
- Optimised images are cached in `node_modules/.astro/assets`, and the cache does not notice a change to
  the image options in `astro.config.mjs`. Delete that folder after changing them.

## Conventions

- Internal links go through `localizedUrl()` in `src/i18n/urls.ts`. The preview is served from a sub-path,
  so a hard-coded `/…` link breaks there.
- Content is data: text and facts live in `src/content`, never in components. Interface labels live in
  `src/i18n/ui.ts`, in both languages.
- The Latvian files in `src/content` are the source since launch; edit them directly.
- Fraternities are shown in seniority order (`order`). Their colours are read top to bottom and `band` is
  the stripe direction; both are identity, not decoration, so never reorder or restyle them.
- Dates and times are Riga wall-clock strings (`src/lib/calendar/dates.ts`); do not use the local time zone
  of the machine.
- `src/lib/calendar/feed.ts` is server-only. Client components import types and
  `dates.ts`/`labels.ts`/`links.ts` only.
- Content refers to a picture as `@/assets/…` (quoted in YAML, because of the `@`), never by a relative
  path: the editing tool has one picture library and writes that prefix.
- `.pages.yml` is the editing tool's view of the content and must match `src/content.config.ts`: a new
  field needs both. Pages CMS rejects keys it does not know, and a `list` written as an object must
  include `collapsible`. Optional fields in the schema go through `optional()`, because a form saves an
  empty field as an empty string or null.
- An image that did not come from the old WordPress site needs an entry in
  `src/data/image-credits.json` (source, author, licence).
- Content arrives in one of two ways; see `src/styles/motion.css`. What is on screen when a page opens
  (hero, page header, the article of a text page) takes `data-enter`, a plain CSS animation that needs no
  script. Everything further down takes `data-reveal`, which the page script shows on scroll. Do not hide
  content any other way, or the watchdog in `Layout.astro` cannot rescue it, and never make a reveal wait
  for a share of the element's own height: that left long articles invisible once.
- A new kind of page goes into `tests/pages.ts`, so the visibility and accessibility tests cover it.
- Long texts are prose. A paragraph that begins with four spaces becomes a box of code, and one that
  begins with a number and a full stop ("1922. gadā") a numbered list; `npm test` fails on both
  (`src/lib/markdown-traps.ts`). Write `1922\. gadā`.
- A text page with a layout of its own keeps the complete imported text on the page, in a section that
  opens: the two histories (`src/content/histories`) and the guide (`src/content/guides`). On a guide,
  a statement that is not in that text names its source in `sources`.
- Accessibility target is WCAG 2.2 AA. A sign used as an icon (→, ↗) is wrapped in `aria-hidden`; a link
  that opens a new tab says so in an `sr-only` span; every photograph has a description (`alt`).
- The calendar is a Preact component: hooks come from `preact/hooks`, markup uses `class`, and SVG
  attributes are written as in SVG (`stroke-width`). Its month is an ARIA grid with one tab stop.
- English texts follow the word list under "English wording" in the spec; change a term there and in
  every text at once. After revising a translation, copy the Latvian `wpModified` into its
  `translatedFrom`.
- The fonts hold only the letters listed in `scripts/build-fonts.mjs`. Any other character still shows,
  but in a system font.
- The seal lettering on the homepage is spaced by a script, not by `textLength`: Safari ignores
  `textLength` for text on a path. Check WebKit as well as Chromium when touching SVG text.

## Astro 7 specifics that differ from older versions

- Templates follow JSX whitespace rules: a line break between two inline elements renders no space. Write
  `{' '}` where a space is needed. Prettier may move inline elements onto separate lines, so check the
  rendered text after formatting.
- Every non-void tag must be closed, and invalid nesting is not auto-corrected.
- Markdown is rendered by Astro's native pipeline; remark and rehype plugins are not available by default.
- Zod is imported from `astro/zod`; collections are defined in `src/content.config.ts` with loaders.
