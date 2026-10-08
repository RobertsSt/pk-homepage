# pk.lv rebuild: spec

Last updated 2026-10-08. This is the one document that records what we are building and what has been
decided. Change it when a decision changes; do not let the code and the spec disagree.

## Goal

Replace the WordPress site at `pk.lv/WordPress/` with a faster, better-looking static site that P!K!
officers can keep up to date without a developer, in Latvian and English, with nothing to patch or
maintain on the server.

## Scope

In scope:

- A new homepage and the three other page types the site has today: text page (10), fraternity list (1)
  and fraternity page (23).
- Everything in Latvian and English, with a language switch on every page.
- The P!K! Google Calendar shown in the site's own design.
- An editing tool for people who do not write code.
- Automatic publishing to the existing nano.lv hosting.

Out of scope for the first version: news or blog posts, member login, forms, search.

## Decisions

| Area          | Decision                                                                                                  | Reason                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Design        | Draft B: paper and ink, serif headings, the fraternities' colours as the only strong colour.              | Chosen by Roberts on 2026-10-07 from two drafts; About, officers, contact and footer follow A.    |
| Framework     | Astro 7 with static output. Preact only for the calendar.                                                 | Pages are plain HTML built ahead of time: fast, readable by search engines, nothing running live. |
| Styling       | Tailwind CSS 4. Fonts are built from their sources, cut down to the letters the site shows.               | A custom look without a component kit; no requests to Google Fonts; a third of the font weight.   |
| Motion        | CSS for entrances, scroll reveals and page transitions; a short script of our own for scroll effects.     | No animation library to load; content is never left hidden if a script fails.                     |
| Accessibility | WCAG 2.2 level AA is the target. Motion is off for visitors who ask their device for less of it.          | The site should work with a keyboard, a screen reader, zoom and high contrast.                    |
| Languages     | Latvian at `/`, English at `/en/`. An untranslated page shows the Latvian text under a notice.            | Latvian stays the primary address; English can be filled in page by page.                         |
| Content       | Markdown and YAML files in `src/content`, checked against schemas in `src/content.config.ts`.             | Plain files are what a git-based editing tool reads and writes, and a typo fails the build.       |
| Calendar      | Read from the public calendar feed when the site is built. Rebuilt nightly. A saved copy is the fallback. | No API key and no dependence on Google while a visitor loads the page.                            |
| Editing tool  | Pages CMS, set up in milestone 5.                                                                         | Editors sign in through a link sent by email, so they need no GitHub account.                     |
| Hosting       | Stays at nano.lv. GitHub Actions builds the site and uploads it over FTPS.                                | No DNS or hosting change; the host offers FTPS but no SSH.                                        |
| Preview       | GitHub Pages, published from `main`.                                                                      | Others can review work before anything touches pk.lv.                                             |
| Quality       | `npm run verify`: Prettier, ESLint, type check, unit tests, build, browser tests. CI runs it on PRs.      | The same checks locally and in CI; some faults only show in a real browser.                       |

The calendar trade-off: a new event appears on the site after the next build, so within a day, or at once
if someone presses "Run workflow" in GitHub. If that proves too slow, a live refresh in the browser can be
added later without changing the design. Its weeks always start on Monday; a test holds that in place.

Two of these changed on 2026-10-08, during the speed pass. The calendar moved from React to Preact: it
is the only interactive component, and React was 66 KB of script for it where Preact is 13 KB. The Motion
library was dropped: it was 22 KB on every page for a counter and a parallax effect, which are now forty
lines in `src/scripts/motion.ts`.

## Accessibility

What is in place:

- Every page has one main heading, headings in order, a language, a title, a "skip to content" link and
  landmarks with names. Text that is shown in Latvian on an English page is marked as Latvian.
- The menu opens with Enter or Space, closes with Escape and says whether it is open. On a phone it is a
  dialog that keeps keyboard focus inside it.
- The calendar is a single stop for the Tab key. Arrow keys move between days, Home and End within the
  week, Page Up and Page Down between months; each day reads out its date and events.
- Colours meet the contrast ratio of 4.5 to 1 for text. Focus is always visible.
- The turning lettering around the crest can be stopped with a button, and never turns for a visitor who
  has asked for reduced motion. Nothing else moves on its own.
- Photographs have descriptions. Decorative images are hidden from screen readers.
- Pages work at 320 px width (400% zoom), print with all content, and keep the calendar's "today" and
  "selected" marks in high-contrast mode.

How it is checked: an automated scan (axe, WCAG 2.2 AA) of one page of each kind and keyboard walks
through the menu and the calendar run with every pull request; see `tests/`.

What has not been done: nobody has yet listened to the site with a screen reader (VoiceOver, NVDA). The
structure a screen reader is given was read and looks right, but that is not the same as using one.

## Speed

Measured with Lighthouse on a simulated mid-range phone on slow 4G, before and after the pass of
2026-10-08:

| Page                    | Score       | Largest paint  | Downloaded      |
| ----------------------- | ----------- | -------------- | --------------- |
| Homepage                | 70–79 → 95  | 5.5 s → 2.9 s  | 890 KB → 462 KB |
| P!K! history (longest)  | 97–100 → 99 | about 2 s both | 313 KB → 207 KB |
| Lettonia (with a photo) | 80 → 96     | 4.1 s → 2.8 s  | 578 KB → 330 KB |

Where it came from: fonts 492 KB → 171 KB, the crest 153 KB → 67 KB on a phone, 88 KB less script on
the homepage and 22 KB less on every other page, and a first screen that no longer waits for a script.

The host (nginx at nano.lv) already compresses text and tells browsers to keep images, fonts, styles and
scripts for 30 days, which suits files whose names change whenever their content does.

## Pages and addresses

| Page            | Latvian                          | English                             |
| --------------- | -------------------------------- | ----------------------------------- |
| Home            | `/`                              | `/en/`                              |
| Text page       | `/<slug>/`, same slugs as today  | `/en/<slug>/`                       |
| Fraternity list | `/studentu-korporacijas/`        | `/en/studentu-korporacijas/`        |
| Fraternity page | `/studentu-korporacijas/<name>/` | `/en/studentu-korporacijas/<name>/` |
| Image credits   | `/attelu-avoti/`                 | `/en/attelu-avoti/`                 |

An English page may later be given its own English slug; until then it reuses the Latvian one.

Every current address under `/WordPress/` redirects to its new address, so existing links and search
results keep working. The build writes these as small redirect pages, which work on any static host.

## Where content lives

| Content                                              | Location                                | Language                    |
| ---------------------------------------------------- | --------------------------------------- | --------------------------- |
| Facts about each fraternity                          | `src/content/fraternities/<name>.yaml`  | Shared by both languages    |
| Long text about each fraternity                      | `src/content/fraternity-texts/{lv,en}/` | One file per language       |
| Text pages                                           | `src/content/pages/{lv,en}/`            | One file per language       |
| Homepage: officers, About photo, milestones, contact | `src/content/site/home.yaml`            | Both languages side by side |
| Menu                                                 | `src/data/navigation.ts`                | Both languages side by side |
| Button and label text                                | `src/i18n/ui.ts`                        | Both languages side by side |
| Images                                               | `src/assets/`                           | n/a                         |
| Source, author and licence of outside images         | `src/data/image-credits.json`           | n/a                         |

Fraternities are always listed in seniority order (the `order` field), as on the current site.

Every image that does not come from the WordPress site must have an entry in `image-credits.json`. The
credits page is built from it, and files under CC BY-SA require that credit to be shown.

## Until launch: WordPress stays the source for Latvian text

The WordPress site is still being edited, so the import is built to be run again:

- `npm run import:wordpress` rewrites every Latvian file and image from WordPress.
- What WordPress does not hold lives in `scripts/import-overrides.json` and is merged in on every run:
  colours, band direction, founding dates, larger heraldry files, chosen photographs and text corrections.
- English files are never touched by the import.
- `src/content/site/home.yaml` is maintained by hand.

So until launch, edit Latvian text in WordPress, not in this repository. The last import happens on launch
day; after that WordPress is retired and the import script is deleted.

## Milestones

1. **Foundation and content import.** Done. Project, checks, CI, repeatable import of 23 fraternities and
   10 text pages, calendar reader, both languages wired up.
2. **Design.** Done. Two drafts were reviewed; B was chosen with four sections taken from A.
3. **Pages.** Done, apart from one thing a person has to do. Built: homepage, text page, fraternity list,
   fraternity page, image credits, 404, working menu, redirects from the old addresses, page titles,
   descriptions and share images. The accessibility and speed passes are done (see above). Still to do:
   listen to the site once with a screen reader.
4. **English.** The homepage, menu and all labels are in English. The ten text pages and 23 fraternity
   texts are not; they show Latvian under a notice. Translate, then have P!K! review.
5. **Editing tool.** Pages CMS configured; a one-page guide for editors in Latvian.
6. **Launch.** Publishing workflow to nano.lv with nightly rebuild; final import; switch; WordPress archived.

Work happens on a branch and reaches `main` through a pull request that passes `npm run verify`.
Milestones 1 to 3 arrived together in the first pull request. The accessibility and speed passes follow
in the branch `accessibility-and-speed`, the English texts in `english-texts`.

## Open questions

1. Heraldry. Sixteen coats of arms now come from Wikimedia Commons at a usable size. Still only 80 to 100
   px: the coats of arms of Philyronia, Patria, Fraternitas Imantica and Fraternitas Vesthardiana, and
   nearly every monogram, cap and cap star. Larger originals would have to come from the fraternities.
2. Colours. Each fraternity's three colours and band direction were read from its shield image, and gold,
   white and black were evened out. Roberts will confirm them. One to look at: Philyronia's band rises on
   the current site but falls in the drawing on Wikimedia Commons.
3. Photos. Nine fraternities have at least one photo. Each has a description for screen readers, written
   from the picture alone; someone who knows the occasions should check them (`alt` and `imageAlts` in
   `scripts/import-overrides.json`). Fourteen have none: Fraternitas Arctica, Lettgallia,
   Ventonia, Tervetia, Philyronia, Fraternitas Metropolitana, Fraternitas Vesthardiana, Fraternitas
   Lataviensis, Patria, Fraternitas Livonica, Gersicania, Fraternitas Cursica, Talavija and Lacuania.
4. Image rights. Photos taken from fraternities' own websites carry no stated licence, and the Fraternitas
   Vanenica coat of arms is marked fair use on Wikipedia. Roberts has said the fraternities are fine with
   this; each should still hear that its pictures are used.
5. English wording, in particular "Presidium Convent" and "student fraternity", and the names of events.
6. Likely typos in the current text. Ventonia's founding year is corrected to 1917 here and should also be
   fixed in WordPress. Still to confirm: Fraternitas Imantica's motto reads "Sclentiae" and Fraternitas
   Lataviensis's reads "lustitia".

## Launch checklist

- [ ] FTPS account for the web root created in the nano.lv panel; host, user and password saved as GitHub
      secrets, never in the repository.
- [ ] Publishing workflow added and run once against a test folder.
- [ ] Final `npm run import:wordpress`, reviewed as a pull request.
- [ ] The old `WordPress` folder renamed on the server, and the rule that sends `/` to `/WordPress/` removed.
- [ ] Site published to the web root; home, one text page, one fraternity page and three old addresses
      checked on pk.lv in both languages.
- [ ] WordPress folder and database archived, then removed.
