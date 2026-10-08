# pk-homepage

The website of P!K! (Prezidiju Konvents), being rebuilt from WordPress as a static site in Latvian and
English. What is being built and why is in [docs/spec.md](docs/spec.md).

## Run it

Needs Node 22.12 or newer (`nvm use` picks the right version).

```sh
npm install
npx playwright install chromium webkit   # once: the browsers the tests run in
npm run dev                              # http://localhost:4321
```

| Command                      | What it does                                                           |
| ---------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`                | Local site with live reload                                            |
| `npm run build`              | Builds the site into `dist/`                                           |
| `npm run preview`            | Serves `dist/` locally, as the host would                              |
| `npm run verify`             | Format check, lint, type check, unit tests, build and browser tests    |
| `npm test`                   | Runs the unit tests                                                    |
| `npm run test:browser`       | Runs the browser tests against `dist/`; build first                    |
| `npm run format`             | Formats the code with Prettier                                         |
| `npm run import:wordpress`   | Re-imports Latvian content and images from the live WordPress site     |
| `npm run check:translations` | Lists English texts that are missing or older than their Latvian text  |
| `npm run build:fonts`        | Rebuilds the web fonts; only after changing the fonts or their letters |

CI runs `npm run verify` on every push, to any branch.

## Where things are

```text
src/
  content/           Text and facts: Markdown and YAML, one folder per kind of content
  content.config.ts  The shape each content file must have; a mistake fails the build
  assets/            Images, optimised at build time
  pages/             One file per address on the site; each only picks a language
  components/
    home/            The sections of the homepage, in the order they appear
    pages/           The inner pages: text page, fraternity list, fraternity page, credits
    calendar/        The calendar, the one part that runs in the browser as a Preact component
  layouts/           Header, footer and <head> shared by every page
  lib/               Logic without markup: calendar feed, shield geometry, links, data loading
  scripts/           What runs in the browser on every page: the menu and scroll-driven motion
  i18n/              Languages: interface text and link helper
  data/              Menu, image credits, saved copy of the calendar feed
  styles/            The stylesheet, the fonts and the states content arrives through
scripts/             WordPress import and its overrides; the font builder
tests/               Browser tests (Playwright): visibility, accessibility, keyboard, links
docs/spec.md         Decisions, milestones, open questions
```

## Tests

- Unit tests sit next to the code they test (`*.test.ts`) and run with Node's own test runner.
- Browser tests are in `tests/` and run against the built site in Chromium, WebKit and a phone-sized
  Chromium. They check that no content stays hidden, run an automated accessibility scan (WCAG 2.2 AA)
  on one page of each kind, and walk the menu and the calendar with the keyboard.
- When a browser test fails, `npx playwright show-trace test-results/<folder>/trace.zip` replays it.

## Content rules

- Until launch, Latvian text is edited in WordPress and brought over with `npm run import:wordpress`.
  Hand edits to imported Latvian files are overwritten by the next import.
- English text and `src/content/site/home.yaml` are edited here. An English text names, in `translatedFrom`,
  the date (`wpModified`) of the Latvian text it was translated from; `npm run check:translations` lists
  the ones whose Latvian text has changed since.
- An image that does not come from WordPress needs an entry in `src/data/image-credits.json`.
- A photograph needs a description for people who cannot see it: `alt` beside it in
  `scripts/import-overrides.json`, or in WordPress for a photograph that comes from there.
- Build internal links with `localizedUrl()` from `src/i18n/urls.ts`, so they also work on the preview,
  which is served from a sub-path.

## Preview and deployment

Pushes to `main` publish a preview to GitHub Pages: <https://robertsst.github.io/pk-homepage/>.

Publishing to pk.lv is the `Deploy` workflow (Actions → Deploy → Run workflow). It builds the site and
uploads it over FTPS into the folder of the FTP account named in the repository's secrets; the comment at
the top of [.github/workflows/deploy.yml](.github/workflows/deploy.yml) lists the settings it needs. For
now it is started by hand. The steps to launch are in the spec under "Publishing to pk.lv".
