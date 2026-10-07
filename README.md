# pk-homepage

The website of P!K! (Prezidiju Konvents), being rebuilt from WordPress as a static site in Latvian and
English. What is being built and why is in [docs/spec.md](docs/spec.md).

## Run it

Needs Node 22.12 or newer (`nvm use` picks the right version).

```sh
npm install
npm run dev        # http://localhost:4321
```

| Command                    | What it does                                                       |
| -------------------------- | ------------------------------------------------------------------ |
| `npm run dev`              | Local site with live reload                                        |
| `npm run build`            | Builds the site into `dist/`                                       |
| `npm run preview`          | Serves `dist/` locally, as the host would                          |
| `npm run verify`           | Format check, lint, type check and build; CI runs the same         |
| `npm run format`           | Formats the code with Prettier                                     |
| `npm run import:wordpress` | Re-imports Latvian content and images from the live WordPress site |

## Where things are

```text
src/
  content/         Text and facts: Markdown and YAML, one folder per kind of content
  content.config.ts  The shape each content file must have; a mistake fails the build
  assets/          Images, optimised at build time
  designs/a, b/    The two homepage design drafts (temporary)
  components/      Pieces shared by every design, e.g. the vector shield
  lib/             Logic without markup: calendar feed, shield geometry, data loading
  i18n/            Languages: interface text and link helper
  data/            Menu structure; saved copy of the calendar feed
  pages/           One file per address on the site
scripts/           WordPress import and its overrides
docs/spec.md       Decisions, milestones, open questions
```

## Content rules

- Until launch, Latvian text is edited in WordPress and brought over with `npm run import:wordpress`.
  Hand edits to imported Latvian files are overwritten by the next import.
- English text and `src/content/site/home.yaml` are edited here.
- Build internal links with `localizedUrl()` from `src/i18n/urls.ts`, so they also work on the preview,
  which is served from a sub-path.

## Preview and deployment

Pushes to `main` publish a preview to GitHub Pages (enable once under Settings → Pages → Source: GitHub
Actions). Publishing to pk.lv is set up at launch; see the launch checklist in the spec.
