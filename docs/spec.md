# pk.lv rebuild: spec

Last updated 2026-10-09. This is the one document that records what we are building and what has been
decided. Change it when a decision changes; do not let the code and the spec disagree.

## Goal

Replace the WordPress site at `pk.lv/WordPress/` with a faster, better-looking static site that P!K!
officers can keep up to date without a developer, in Latvian and English, with nothing to patch or
maintain on the server.

## Scope

In scope:

- A new homepage and the three other page types the site has today: text page (10), fraternity list (1)
  and fraternity page (23). Three of the ten text pages have since been given a layout of their own: the
  two histories and the guide to student fraternities.
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
| Editing tool  | Pages CMS, configured in `.pages.yml`.                                                                    | Editors sign in through a link sent by email, so they need no GitHub account.                     |
| Hosting       | Stays at nano.lv. GitHub Actions builds the site and uploads it over FTPS (the `Deploy` workflow).        | No DNS or hosting change; the host offers FTPS but no SSH.                                        |
| Preview       | GitHub Pages, published from `main`.                                                                      | Others can review work before anything touches pk.lv.                                             |
| Quality       | `npm run verify`: Prettier, ESLint, type check, unit tests, build, browser tests. CI runs it on PRs.      | The same checks locally and in CI; some faults only show in a real browser.                       |

The calendar trade-off: a new event appears on the site after the next build, so within a day, or at once
if someone presses "Run workflow" in GitHub. If that proves too slow, a live refresh in the browser can be
added later without changing the design. Its weeks always start on Monday; a test holds that in place.

What the calendar shows, compared with the Google box it replaced (settled 2026-10-09):

- Each event in the list opens on a press. It then gives the place as Google has it, a link to that
  place on a map, and a link that copies this one event into the visitor's Google Calendar. The line
  itself shows the time from start to end and the street with the town.
- A description is shown when it says more than the title.
- The months on offer run from last month to thirteen months ahead. Older events stay in Google
  Calendar, which the link under the list opens; they are not on the site.

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

## History reading experience

The two history routes use a shared editorial layout with archival photographs, five readable
chapters, a sticky chapter guide, an interactive overview and expandable term explanations. The
homepage history section uses the same manual timeline controls. Arrow keys, Home and End also
select milestones; nothing advances automatically. Transitions respect reduced motion, and the
chapters and timeline summaries remain readable without JavaScript.

The new narrative is maintained in `src/content/histories/*.yaml` through “Vēstures stāsti” in Pages
CMS. The complete imported Markdown texts remain available in an expandable section on each page;
WordPress imports do not overwrite the new narrative. Existing photographs are reused with captions
that do not assign an undocumented date to them.

## The guide to student fraternities

“Kas ir studentu korporācijas?” is the page a newcomer reads first, so it is laid out as a guide: the
four principles, what sets a fraternity apart, the path from fox to philister, the insignia, life in a
fraternity, questions and a glossary. The insignia are shown on the fraternity that presides this
year, so the example changes with the presidium and no fraternity is singled out.

The sections are content, in `src/content/guides/*.yaml`, edited under “Skaidrojošās lapas” in Pages
CMS. Two rules keep the page honest:

- The complete text imported from WordPress stays on the page, in a section that opens on request.
  The guide shortens that text; it does not replace it.
- A statement that is not in that text names its source in the list at the foot of the page. The
  sources used are Latvian and of standing: the University of Latvia, Latvijas Vēstnesis, LSM, the Tēzaurs
  dictionary, a University of Latvia thesis on heraldry and the sororities' own union. Wikipedia was
  read to compare, not cited.

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
results keep working. The build writes each redirect twice: as a rule for the hosting's server, which
answers "moved permanently" in one step and drops whatever followed a `?`, and as a small redirect
page, which does the same on a host that ignores the rules (the preview). Addresses of pictures under
`/WordPress/wp-content/uploads/` are not carried over; they end at the "page not found" page.

The old homepage, `/WordPress/` itself, is the one address that is not redirected. While WordPress
stood at pk.lv, the address pk.lv answered "moved permanently to /WordPress/" without saying for how
long, and Chrome and its relatives keep such an answer for good. Sending `/WordPress/` back to the
homepage would pass every returning visitor back and forth until the browser stopped with "too many
redirects"; this was reproduced on 2026-10-09 before the switch. So `/WordPress/` serves the homepage
itself (`src/pages/WordPress`), names `/` as its canonical address, and a few lines of script fetch
the real homepage afresh, which replaces what the browser remembers, and then move the visitor there.
A test plays the returning visitor (`tests/returning-visitor.spec.ts`). The page can go once nobody's
browser can still remember WordPress, which is a matter of years, not weeks.

## Where content lives

| Content                                              | Location                                | Language                    |
| ---------------------------------------------------- | --------------------------------------- | --------------------------- |
| Facts about each fraternity                          | `src/content/fraternities/<name>.yaml`  | Shared by both languages    |
| Long text about each fraternity                      | `src/content/fraternity-texts/{lv,en}/` | One file per language       |
| History story chapters and term explanations         | `src/content/histories/*.yaml`          | Both languages side by side |
| Guide sections, questions, glossary and sources      | `src/content/guides/*.yaml`             | Both languages side by side |
| Text pages                                           | `src/content/pages/{lv,en}/`            | One file per language       |
| Homepage: officers, About photo, milestones, contact | `src/content/site/home.yaml`            | Both languages side by side |
| Menu                                                 | `src/data/navigation.ts`                | Both languages side by side |
| Button and label text                                | `src/i18n/ui.ts`                        | Both languages side by side |
| Images, referred to in content as `@/assets/…`       | `src/assets/`                           | n/a                         |
| Source, author and licence of outside images         | `src/data/image-credits.json`           | n/a                         |

Fraternities are always listed in seniority order (the `order` field), as on the current site.

Every image that does not come from the WordPress site must have an entry in `image-credits.json`. The
credits page is built from it, and files under CC BY-SA require that credit to be shown.

## Until launch: WordPress stays the source for Latvian text

The WordPress site is still being edited, so the import is built to be run again:

- `npm run import:wordpress` rewrites every Latvian file and image from WordPress.
- What WordPress does not hold lives in `scripts/import-overrides.json` and is merged in on every run:
  colours, band direction, founding dates, larger heraldry files, chosen photographs and text corrections.
- English files are never touched by the import. Each records, as `translatedFrom`, the date of the
  Latvian text it was made from, and the import ends by listing the English texts that have fallen behind
  (`npm run check:translations` gives the same list at any time).
- `src/content/site/home.yaml` and the files in `src/content/histories` and `src/content/guides` are
  maintained by hand.
- A fraternity's mottos and contacts stand in WordPress twice, on the list and on its own page, and the
  two are edited separately. The import reads both: each fills in what the other lacks, and where they
  disagree the page edited last is used and the import says so.
- Indents typed as rows of spaces are taken out, and a line break followed by an indent becomes a new
  paragraph. Left in, Markdown drew such a paragraph as a box of code that ran off the screen.

Long texts are prose, and a check in `npm test` keeps them so (`src/lib/markdown-traps.ts`): a paragraph
that begins with four spaces, or with a number and a full stop ("1922. gadā …", which Markdown reads as
item 1922 of a list), fails the checks with the file, the line and the remedy. This guards hand edits
after launch as much as the import.

So until launch, edit Latvian text in WordPress, not in this repository. The last import happens on launch
day; after that WordPress is retired and the import script is deleted.

## Milestones

1. **Foundation and content import.** Done. Project, checks, CI, repeatable import of 23 fraternities and
   10 text pages, calendar reader, both languages wired up.
2. **Design.** Done. Two drafts were reviewed; B was chosen with four sections taken from A.
3. **Pages.** Done, apart from one thing a person has to do. Built: homepage, text page, the two history
   pages, the guide to student fraternities, fraternity list, fraternity page, image credits, 404,
   working menu, redirects from the old addresses, page titles, descriptions and share images. The
   accessibility and speed passes are done (see above). On 2026-10-09 every page of the WordPress site
   was compared with its new page, word by word and picture by picture; what that found has been put
   right. Still to do: listen to the site once with a screen reader.
4. **English.** Translated, not yet reviewed. The homepage, menu, labels, the ten text pages and the 23
   fraternity texts are in English (about 33,000 words). The translation was made by Claude on 2026-10-08
   and nobody from P!K! has read it yet; that review is the part still to do. The word choices are listed
   under "English wording" below.
5. **Editing tool.** Working. `.pages.yml` describes every content file as a form; the guide for editors
   is `docs/redigesanas-pamaciba.md`. On 2026-10-08 Roberts installed the app and saved one edit, which
   arrived as one clean commit with the rest of the file intact. Not yet tried: uploading a picture,
   editing a long text, the forms for YAML files. Editors are invited after the switch. See "Editing
   tool" below.
6. **Launch.** The site is published to a trial folder, `https://pk.lv/jauna/`, by the same workflow that
   will publish the real one, automatically and every night. Still to do: check the server rules there,
   the final import, the switch, WordPress archived. See "Publishing to pk.lv" below.

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
5. English wording. The translation follows one set of choices, listed in the next section, so that a
   reviewer can change a term everywhere at once. The ones most worth a second opinion: "Presidium Convent",
   "student fraternity", "philister" and "comment".
6. Faults in the current Latvian text, found while translating. They are in WordPress, so that is where
   they need correcting; the English text already has what was clearly meant, and says nothing where the
   meaning could not be recovered.
   - Ventonia's founding year: corrected to 1917 here, still to fix in WordPress.
   - Fraternitas Lettica: the list gives a phone and "Lāčplēša ielā 5", its own page an e-mail and
     "Lāčplēša iela 5". The site shows the phone, the e-mail and the address of its own page, which
     was edited last. Ventonia's second motto is likewise only on its own page.
   - Vendia: on its own page the e-mail link opens seniors@beveronija.lv, though it shows Vendia's
     address. The site uses the address that is shown.
   - Mottos: Fraternitas Imantica's reads "Sclentiae" and Fraternitas Lataviensis's "lustitia" in the list.
   - P!K! history: "24.11.1997" for Selonija's admission to the C!C! (1897) and "Vironia (1990.)" (1900);
     "apliecinājusi" where "apcietinājusi" is meant; the entry for the 1st semester of 1927 ends in the
     stray words "Marta menesi"; in the list of fraternities, "saluten", "Actilabores", "Mit Eort" and
     "niebei".
   - Selonija: WordPress turned six dated paragraphs into a numbered list that starts at 1918, so it shows
     the years 1918 to 1923 one after another. The earlier copy of the page (`selonija-3`, still
     published) has the years as they were written: 1918, 1918, 1920, 1923, 1927 and 1946; Selonija's own
     website confirms the last. Both languages give those years here (`textFixes` in the overrides);
     WordPress still shows the list.
   - Lettgallia: two paragraphs begin "gadā …" and "gada 27. septembri …" with the year missing (1919).
   - Fraternitas Lettica: "1960. gadu beigās" for the national awakening of the 1860s.
   - Fraternitas Imantica: a sentence is split in two after "1947."
   - Vendia: admitted to P!K! on 9 December 1930 here, on 9 December 1929 in the P!K! history.
   - Tervetia: the Estonian fraternity is spelt "Ugula" (Ugala).
   - P!K! Men's Choir: says all 23 fraternities belong to P!K!; the list has 20 members and 3 outside.
   - Association of Latvian Fraternities: the text is a scan with many misread words ("Te viļas fonds",
     "Laiviņas", "Pīki") and breaks off in the middle of its last sentence.
   - Scanning slips elsewhere: "Gersicamu", "Eslmgenā" (Gersicania), "Philvroniu" (Philyronia), "kāp" for
     "kara" (Patria, Vendia).

7. Visitor statistics. WordPress counted visits with Jetpack; the new site counts nothing. The hosting's
   own log statistics (cPanel, Awstats) need no change to the site and no consent banner. A counter in
   the page is a decision for P!K!: it means an account with a service, and one that sets cookies means
   a consent banner as well. Nothing is built until that is decided.
8. The archive at `pk.lv/old/`. A copy of the site as it was before WordPress, made in December 2016:
   news, press releases, photo galleries, about 390 pages. Nothing on WordPress or on the new site
   links to it, and none of it has been carried over. Decided on 2026-10-09: it stays where it is for
   now and is not removed with WordPress. It is plain HTML, so it needs nothing from WordPress.

## English wording

| Latvian                     | English used                         | Note                                               |
| --------------------------- | ------------------------------------ | -------------------------------------------------- |
| Prezidiju Konvents (P!K!)   | Presidium Convent                    | Abbreviations (P!K!, L!K!A!, F!B!S!) are kept.     |
| studentu korporācija        | student fraternity                   | "studenšu korporācija" is "sorority".              |
| konvents                    | convent                              | Both the body and its meeting.                     |
| filistrs, filistru biedrība | philister, philisters' society       |                                                    |
| komiltonis                  | commilito, commilitones              |                                                    |
| fuksis, zēns, krustdēls     | fox, or new member                   | Each fraternity's own word is not carried over.    |
| krāsnesis                   | colour-bearer                        |                                                    |
| komāns                      | comment                              | A!K!K!: Comment of the United Fraternities.        |
| garantēt komānu pie …       | to vouch for the comment with …      | "komāna garants": guarantor of the comment.        |
| kartelis                    | cartel                               |                                                    |
| komeršs                     | commers                              | Baltic Nations' Commers.                           |
| Zemes tēvs, kāters, ūzuss   | Landesvater, Kater, custom           | German student terms are kept where usual.         |
| Šaržēto Konvents            | Chargierten-Convent                  | Ch!C! in Tartu, C!C! in Riga.                      |
| deķelis, cirķelis, vapenis  | cap, Zirkel (monogram), coat of arms | Labels on the site say "Monogram".                 |
| konventa dzīvoklis          | convent quarters                     |                                                    |
| kopa (trimdā)               | chapter                              | K!K!, the joint groups in exile: fraternity group. |
| seniors, I šaržētais        | senior, 1st officer                  | Also vice-senior, secretary, Oldermann.            |
| Tērbata                     | Tartu                                |                                                    |
| Atsevišķā studentu rota     | Separate Student Company             |                                                    |
| Brīvības cīņas              | War of Independence                  |                                                    |
| Baigais gads                | Year of Terror                       |                                                    |
| trimda                      | exile                                |                                                    |

Dates are written as "27 September 1919". Latvian mottos are kept in Latvian with the English in brackets;
Latin and German ones are left as they are. Names of people, streets and publications are not translated.

## Editing tool

Pages CMS is a web form over the files in this repository. Saving a form writes a commit to `main`, as if a
developer had edited the file; nothing else stores content.

- What can be edited: the homepage data, the facts and photographs of each fraternity, the long texts and
  the text pages in both languages, the image credits, and the picture library.
- What cannot: adding, renaming or deleting a page or a fraternity. File names are addresses, and a new
  page also needs a place in the menu, which is code.
- A save cannot break the live site. Each commit is checked by CI, and once publishing is automatic it
  will run only after CI has passed; a form saved with a wrong value leaves the site as it was. A field
  left empty is read as "not given", whatever the tool writes for it.
- The tool rewrites a file when it saves it: comments in a YAML file are lost and its layout may change.
- Installing the tool gives its app write access to this repository. That is how it saves; it is also a
  reason to keep the FTP account limited to the site's own folder.

Until the switch, Latvian texts still come from WordPress and an import overwrites them, so editors are
invited only after it.

Once WordPress is gone, `translatedFrom` can no longer be compared with a WordPress date. The check for
translations that have fallen behind then has to compare when the two files were last changed.

## Publishing to pk.lv

What is known about the host, checked on 2026-10-08:

- nano.lv shared hosting with cPanel; the server is `if17.nano.lv`. FTP offers TLS, and its certificate is
  issued for `*.nano.lv`, so the server is addressed by that name, not as pk.lv.
- nginx answers in front of Apache. It compresses text and lets browsers keep images, fonts, styles and
  scripts for 30 days.
- Left to itself the host serves the site over plain http as well as https, and as www.pk.lv as well as
  pk.lv, and answers a missing address with its own "404" page.
- The folder pk.lv is served from holds WordPress twice: loose files of its own, whose `index.php` sends
  `/` on to `/WordPress/`, and the `WordPress` folder with the site people see.

How publishing works:

- The `Deploy` workflow builds the site and uploads `dist/` over FTPS into the folder of the FTP account
  it is given. It deletes only files it uploaded itself on an earlier run.
- It follows every run of the checks (CI) that passes on `main`: after a merge, after an edit saved in
  the editing tool, and after the run CI makes every night, which is what brings new calendar events to
  the site. A commit whose checks fail is not published. It can also be started by hand.
- GitHub switches a schedule off after 60 days without a commit. The nightly run asks for the workflow
  to stay enabled, which restarts that count; if events ever stop appearing, look there first.
- The build writes two files for the host beside the pages: `.htaccess`, which moves every old
  WordPress address to its new page, makes `https://pk.lv` the one address (plain http, www and other
  names are forwarded to it) and shows our own "page not found", and `robots.txt`, which points search
  engines to the list of pages.
- The rules can be tried without the host: macOS has Apache (`/usr/sbin/httpd`), which reads `.htaccess`
  when it is pointed at `dist/` with `AllowOverride All`. They were tried that way on 2026-10-09 with the
  site at `/` and at `/jauna/`.

The site is published in two steps, so that the first upload cannot touch the live site:

1. **Trial folder.** Done. An FTP account that can only see the folder `jauna`, and `DEPLOY_BASE_PATH` set
   to `/jauna/`. The site is at `https://pk.lv/jauna/`, marked as not to be indexed.
2. **The switch.** WordPress is moved out of the folder pk.lv is served from, the FTP account is given
   that folder, and `DEPLOY_BASE_PATH` becomes `/`. To go back, the same steps are undone: WordPress is
   moved in again and the two settings are put back.

## Launch checklist

Trial folder:

- [x] In cPanel, an FTP account limited to the trial folder.
- [x] In GitHub, the secrets `FTP_SERVER` (`if17.nano.lv`), `FTP_USERNAME`, `FTP_PASSWORD` and the variable
      `DEPLOY_BASE_PATH` (`/jauna/`). Never in the repository.
- [x] `Deploy` run; `https://pk.lv/jauna/` checked in two browser engines: eight pages in both languages,
      images, fonts, calendar, menu, old addresses.
- [x] What is in the folder pk.lv is served from: seen.
- [x] The server rules checked in the trial folder (2026-10-08): http and www are forwarded once and
      without a loop, and a missing address shows our own page.
- [x] Old addresses checked in the trial folder (2026-10-09): all 38, with and without the closing
      slash, answer "moved permanently" and land on a page that answers.

The switch. The steps from the GitHub settings to the `Deploy` run are done in one sitting; pk.lv is
away for about five minutes.

- [x] Final `npm run import:wordpress` (2026-10-09, after the last merge): WordPress held nothing the
      site did not already have. To be run again only if WordPress is edited before the switch.
- [ ] A backup downloaded to a computer: the WordPress files (the folders `WordPress`, `wp-admin`,
      `wp-content`, `wp-includes` and the loose files beside them) and its database. A backup that
      stays on the server goes when the server's files go.
- [ ] A new FTP account whose folder is exactly the one pk.lv is served from: `pk.lv`, with nothing
      after it. Not the account's home, and not `public_html`, which is another site (spk.lv).
- [ ] A moment when no workflow is running and the day's nightly run is over, so that nothing is
      published halfway through.
- [ ] In GitHub, the secrets `FTP_USERNAME` and `FTP_PASSWORD` changed to the new account and the
      variable `DEPLOY_BASE_PATH` changed to `/`.
- [ ] WordPress moved out of the folder pk.lv is served from, to a folder beside it that the web cannot
      reach: the folders `WordPress`, `wp-admin`, `wp-content`, `wp-includes` and the loose WordPress
      files, hidden ones such as `.htaccess` included. What stays: `jauna`, `old`, `.well-known` (the
      certificate is renewed through it) and `cgi-bin`. The new site needs the name `WordPress` for
      the old addresses, and a leftover `index.php` would be served in place of the new homepage.
- [ ] `Deploy` run by hand. Its last step confirms that pk.lv serves the new build.
- [ ] Checked on pk.lv in both languages: home, one text page, one fraternity page, three old addresses
      under `/WordPress/`, a missing address, http and www, and `/old/`. And in a browser that knew the
      WordPress site: typing pk.lv must end on the homepage, not on an error.
- [ ] The trial folder `jauna` and its FTP account removed.
- [ ] Editors invited to the editing tool; the check for translations that have fallen behind changed to
      compare when the two files were last edited; the import script deleted.
- [ ] After a few weeks: the WordPress archive and database removed.
