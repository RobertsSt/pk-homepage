# pk.lv rebuild: spec

Last updated 2026-10-07. This is the one document that records what we are building and what has been
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

| Area         | Decision                                                                                                     | Reason                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Design       | Draft B: paper and ink, serif headings, the fraternities' colours as the only strong colour.                 | Chosen by Roberts on 2026-10-07 from two drafts; About, officers, contact and footer follow A.    |
| Framework    | Astro 7 with static output. React 19 only for the calendar.                                                  | Pages are plain HTML built ahead of time: fast, readable by search engines, nothing running live. |
| Styling      | Tailwind CSS 4. Fonts are bundled with the site (Fontsource).                                                | A custom look without a component kit; no requests to Google Fonts.                               |
| Motion       | CSS for scroll reveals and page transitions, Motion for scroll-linked effects. Off for reduced-motion users. | Small and dependable; content is never left hidden if a script fails.                             |
| Languages    | Latvian at `/`, English at `/en/`. An untranslated page shows the Latvian text under a notice.               | Latvian stays the primary address; English can be filled in page by page.                         |
| Content      | Markdown and YAML files in `src/content`, checked against schemas in `src/content.config.ts`.                | Plain files are what a git-based editing tool reads and writes, and a typo fails the build.       |
| Calendar     | Read from the public calendar feed when the site is built. Rebuilt nightly. A saved copy is the fallback.    | No API key and no dependence on Google while a visitor loads the page.                            |
| Editing tool | Pages CMS, set up in milestone 5.                                                                            | Editors sign in through a link sent by email, so they need no GitHub account.                     |
| Hosting      | Stays at nano.lv. GitHub Actions builds the site and uploads it over FTPS.                                   | No DNS or hosting change; the host offers FTPS but no SSH.                                        |
| Preview      | GitHub Pages, published from `main`.                                                                         | Others can review work before anything touches pk.lv.                                             |
| Quality      | `npm run verify`: Prettier, ESLint with accessibility rules, type check, tests, build. CI runs it on PRs.    | The same checks locally and in CI.                                                                |

The calendar trade-off: a new event appears on the site after the next build, so within a day, or at once
if someone presses "Run workflow" in GitHub. If that proves too slow, a live refresh in the browser can be
added later without changing the design. Its weeks always start on Monday; a test holds that in place.

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
3. **Pages.** Built: homepage, text page, fraternity list, fraternity page, image credits, 404, working
   menu, redirects from the old addresses, page titles, descriptions and share images. Still to do: an
   accessibility pass with a screen reader and keyboard, and a speed pass.
4. **English.** The homepage, menu and all labels are in English. The ten text pages and 23 fraternity
   texts are not; they show Latvian under a notice. Translate, then have P!K! review.
5. **Editing tool.** Pages CMS configured; a one-page guide for editors in Latvian.
6. **Launch.** Publishing workflow to nano.lv with nightly rebuild; final import; switch; WordPress archived.

Work happens on a branch and reaches `main` through a pull request that passes `npm run verify`.
Milestones 1 to 3 arrive together in the first pull request, from the branch `static-site-rebuild`.

## Open questions

1. Heraldry. Sixteen coats of arms now come from Wikimedia Commons at a usable size. Still only 80 to 100
   px: the coats of arms of Philyronia, Patria, Fraternitas Imantica and Fraternitas Vesthardiana, and
   nearly every monogram, cap and cap star. Larger originals would have to come from the fraternities.
2. Colours. Each fraternity's three colours and band direction were read from its shield image, and gold,
   white and black were evened out. Roberts will confirm them. One to look at: Philyronia's band rises on
   the current site but falls in the drawing on Wikimedia Commons.
3. Photos. Nine fraternities have at least one photo. Fourteen have none: Fraternitas Arctica, Lettgallia,
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
