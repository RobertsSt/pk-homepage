# pk-homepage

Static site for P!K! (pk.lv): Astro 7, Tailwind 4, React 19 for the calendar only, Latvian and English.
Read [docs/spec.md](docs/spec.md) first: it holds the decisions, the milestones and the open questions.

## Commands

- `npm run verify` runs format check, lint, type check and build. Run it before calling work done.
- `npx astro dev --background` starts the dev server (port 4321); `npx astro dev stop` ends it.
  `astro preview` also detaches; stop it with `npx astro preview stop`.
- `npm run import:wordpress` re-imports Latvian content from the live WordPress site.

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

## Astro 7 specifics that differ from older versions

- Templates follow JSX whitespace rules: a line break between two inline elements renders no space. Write
  `{' '}` where a space is needed. Prettier may move inline elements onto separate lines, so check the
  rendered text after formatting.
- Every non-void tag must be closed, and invalid nesting is not auto-corrected.
- Markdown is rendered by Astro's native pipeline; remark and rehype plugins are not available by default.
- Zod is imported from `astro/zod`; collections are defined in `src/content.config.ts` with loaders.

## Temporary

`src/designs/a`, `src/designs/b`, `src/pages/drafts`, `src/pages/en/drafts`, `src/components/DraftBar.astro`
and the chooser in `src/pages/index.astro` exist only until a design is chosen.
