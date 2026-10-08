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
- Only one dev server can run per project. If Roberts already has one open (`npx astro dev status`), use
  it at http://localhost:4321 and never stop it. Otherwise `npx astro dev --background` starts one and
  `npx astro dev stop` ends it. `astro preview` also detaches; stop it with `npx astro preview stop`.
- A running dev server can go stale when a build or a schema change happens underneath it: pages error or
  scripts return 504. Saving `astro.config.mjs` restarts it; a real edit to `src/content.config.ts` makes
  it re-read the schema.
- `npm run import:wordpress` re-imports Latvian content from the live WordPress site, and ends by listing
  English texts whose Latvian source has changed (`npm run check:translations` on its own does the same).
- `npm run build:fonts` rebuilds `src/assets/fonts` from the pinned sources. Needed only when the list of
  characters in `scripts/build-fonts.mjs` or the fonts change.
- Optimised images are cached in `node_modules/.astro/assets`, and the cache does not notice a change to
  the image options in `astro.config.mjs`. Delete that folder after changing them.

## Conventions

- Internal links go through `localizedUrl()` in `src/i18n/urls.ts`. The preview is served from a sub-path,
  so a hard-coded `/…` link breaks there.
- Content is data: text and facts live in `src/content`, never in components. Interface labels live in
  `src/i18n/ui.ts`, in both languages.
- Do not hand-edit imported Latvian files in `src/content` before launch; the next import overwrites them.
  Corrections that must survive go in `scripts/import-overrides.json`.
- Fraternities are shown in seniority order (`order`). Their colours are read top to bottom and `band` is
  the stripe direction; both are identity, not decoration, so never reorder or restyle them.
- Dates and times are Riga wall-clock strings (`src/lib/calendar/dates.ts`); do not use the local time zone
  of the machine.
- `src/lib/calendar/feed.ts` is server-only. Client components import types and `dates.ts`/`labels.ts` only.
- Content refers to a picture as `@/assets/…` (quoted in YAML, because of the `@`), never by a relative
  path: the editing tool has one picture library and writes that prefix.
- `.pages.yml` is the editing tool's view of the content and must match `src/content.config.ts`: a new
  field needs both. Pages CMS rejects keys it does not know, and a `list` written as an object must
  include `collapsible`. Optional fields in the schema go through `optional()`, because a form saves an
  empty field as an empty string or null.
- An image from outside WordPress needs an entry in `src/data/image-credits.json` (source, author,
  licence), and a path in `scripts/import-overrides.json` if it replaces an imported one.
- Content arrives in one of two ways; see `src/styles/motion.css`. What is on screen when a page opens
  (hero, page header, the article of a text page) takes `data-enter`, a plain CSS animation that needs no
  script. Everything further down takes `data-reveal`, which the page script shows on scroll. Do not hide
  content any other way, or the watchdog in `Layout.astro` cannot rescue it, and never make a reveal wait
  for a share of the element's own height: that left long articles invisible once.
- A new kind of page goes into `tests/pages.ts`, so the visibility and accessibility tests cover it.
- Accessibility target is WCAG 2.2 AA. A sign used as an icon (→, ↗) is wrapped in `aria-hidden`; a link
  that opens a new tab says so in an `sr-only` span; every photograph has a description (`alt`), which for
  imported content lives in `scripts/import-overrides.json`.
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
