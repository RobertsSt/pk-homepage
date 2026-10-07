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
| Framework    | Astro 7 with static output. React 19 only for the calendar.                                                  | Pages are plain HTML built ahead of time: fast, readable by search engines, nothing running live. |
| Styling      | Tailwind CSS 4. Fonts are bundled with the site (Fontsource).                                                | A custom look without a component kit; no requests to Google Fonts.                               |
| Motion       | CSS transitions for scroll reveals, Motion for scroll-linked effects. Off for reduced-motion visitors.       | Small and dependable; content is never hidden when JavaScript is unavailable.                     |
| Languages    | Latvian at `/`, English at `/en/`.                                                                           | Latvian stays the primary address; English never replaces it.                                     |
| Content      | Markdown and YAML files in `src/content`, checked against schemas in `src/content.config.ts`.                | Plain files are what a git-based editing tool reads and writes, and a typo fails the build.       |
| Calendar     | Read from the public calendar feed when the site is built. Rebuilt nightly. A saved copy is the fallback.    | No API key and no dependence on Google while a visitor loads the page.                            |
| Editing tool | Pages CMS, set up in milestone 5.                                                                            | Editors sign in through a link sent by email, so they need no GitHub account.                     |
| Hosting      | Stays at nano.lv. GitHub Actions builds the site and uploads it over FTPS.                                   | No DNS or hosting change; the host offers FTPS but no SSH.                                        |
| Preview      | GitHub Pages, published from `main`.                                                                         | Others can review work before anything touches pk.lv.                                             |
| Quality      | `npm run verify`: Prettier, ESLint with accessibility rules, type check, build. CI runs it on pull requests. | The same checks locally and in CI.                                                                |

The calendar trade-off: a new event appears on the site after the next build, so within a day, or at once
if someone presses "Run workflow" in GitHub. If that proves too slow, a live refresh in the browser can be
added later without changing the design.

## Pages and addresses

| Page            | Latvian                          | English                             |
| --------------- | -------------------------------- | ----------------------------------- |
| Home            | `/`                              | `/en/`                              |
| Text page       | `/<slug>/`, same slugs as today  | `/en/<slug>/`                       |
| Fraternity list | `/studentu-korporacijas/`        | `/en/studentu-korporacijas/`        |
| Fraternity page | `/studentu-korporacijas/<name>/` | `/en/studentu-korporacijas/<name>/` |

An English page may later be given its own English slug; until then it reuses the Latvian one.

Every current address under `/WordPress/` gets a redirect to its new address, so existing links and search
results keep working. The build writes these as small redirect pages, which work on any static host.

## Where content lives

| Content                                | Location                                | Language                    |
| -------------------------------------- | --------------------------------------- | --------------------------- |
| Facts about each fraternity            | `src/content/fraternities/<name>.yaml`  | Shared by both languages    |
| Long text about each fraternity        | `src/content/fraternity-texts/{lv,en}/` | One file per language       |
| Text pages                             | `src/content/pages/{lv,en}/`            | One file per language       |
| Homepage: officers, presiding, contact | `src/content/site/home.yaml`            | Both languages side by side |
| Menu                                   | `src/data/navigation.ts`                | Both languages side by side |
| Button and label text                  | `src/i18n/ui.ts`                        | Both languages side by side |
| Images                                 | `src/assets/`                           | n/a                         |

Fraternities are always listed in seniority order (the `order` field), as on the current site.

## Until launch: WordPress stays the source for Latvian text

The WordPress site is still being edited, so the import is built to be run again:

- `npm run import:wordpress` rewrites every Latvian file and image from WordPress.
- Facts WordPress does not hold (colours, band direction, founding dates) live in
  `scripts/import-overrides.json` and are merged in on every run.
- English files are never touched by the import.
- `src/content/site/home.yaml` is maintained by hand.

So until launch, edit Latvian text in WordPress, not in this repository. The last import happens on launch
day; after that WordPress is retired and the import script is deleted.

## Milestones

1. **Foundation and content import.** Done. Project, checks, CI, repeatable import of 23 fraternities and
   10 text pages, calendar reader, both languages wired up.
2. **Design.** In progress. Two homepage drafts at `/drafts/a/` and `/drafts/b/`. Done when one is chosen
   and the other is deleted.
3. **Pages.** The chosen design applied to the text page, fraternity list and fraternity page; working
   menu; redirects from the old addresses; 404 page; page titles, descriptions and share images; an
   accessibility pass and a speed pass.
4. **English.** Every page translated, then reviewed by P!K!.
5. **Editing tool.** Pages CMS configured; a one-page guide for editors in Latvian.
6. **Launch.** Publishing workflow to nano.lv with nightly rebuild; final import; switch; WordPress archived.

Each milestone is one branch and one pull request, merged only when `npm run verify` passes.

## Open questions

1. Which design, A or B, or which parts of each.
2. Heraldry files. For 22 of the 23 fraternities at least one coat of arms, monogram, cap or star on the
   current site is under 200 px wide, which is too small to show large. Larger originals are needed.
3. Colours. Each fraternity's three colours and band direction were read from its shield image, and gold,
   white and black were evened out. Each fraternity should confirm its colours.
4. Photos. Four fraternities have photos (Beveronija, Fraternitas Lettica, Selonija, Vendia). For the other
   nineteen, photos would come from their own websites, used only once that fraternity agrees.
5. English wording, in particular "Presidium Convent" and "student fraternity", and the names of events.
6. Likely typos in the current text, to confirm before they are carried over: Ventonia's page gives its
   founding year as 1997 (the calendar says 1917); Fraternitas Imantica's motto reads "Sclentiae";
   Fraternitas Lataviensis's motto reads "lustitia".

## Launch checklist

- [ ] FTPS account for the web root created in the nano.lv panel; host, user and password saved as GitHub
      secrets, never in the repository.
- [ ] Publishing workflow added and run once against a test folder.
- [ ] Final `npm run import:wordpress`, reviewed as a pull request.
- [ ] The old `WordPress` folder renamed on the server, and the rule that sends `/` to `/WordPress/` removed.
- [ ] Site published to the web root; home, one text page, one fraternity page and three old addresses
      checked on pk.lv in both languages.
- [ ] WordPress folder and database archived, then removed.
