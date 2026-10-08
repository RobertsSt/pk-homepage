#!/usr/bin/env node
/**
 * Lists the English texts that are missing or older than their Latvian source.
 *
 *   npm run check:translations
 *
 * Every English text records in `translatedFrom` the `wpModified` date of the
 * Latvian text it was translated from. When the Latvian text has been edited
 * since, the two dates differ and the translation needs another look. The
 * WordPress import runs this at its end, which is when Latvian texts change.
 *
 * This reports and never fails: a page without a translation, or with an old
 * one, still works. It shows the Latvian text under a notice, or the older
 * English text.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const CONTENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/content');
const COLLECTIONS = ['pages', 'fraternity-texts'];

/** The front matter of a Markdown file, or an empty object if there is none. */
async function frontmatter(file) {
  const text = await readFile(file, 'utf8').catch(() => undefined);
  if (text === undefined) return undefined;
  const block = /^---\n([\s\S]*?)\n---/.exec(text);
  return block ? (parse(block[1]) ?? {}) : {};
}

const sameMoment = (a, b) => new Date(a).getTime() === new Date(b).getTime();

export async function checkTranslations() {
  const missing = [];
  const outdated = [];
  for (const collection of COLLECTIONS) {
    const names = (await readdir(path.join(CONTENT, collection, 'lv'))).filter((name) =>
      name.endsWith('.md'),
    );
    for (const name of names) {
      const latvian = await frontmatter(path.join(CONTENT, collection, 'lv', name));
      const english = await frontmatter(path.join(CONTENT, collection, 'en', name));
      const label = `${collection}/en/${name}`;
      if (!english) missing.push(label);
      else if (!english.translatedFrom || !sameMoment(english.translatedFrom, latvian.wpModified)) {
        outdated.push(`${label} (Latvian text changed ${String(latvian.wpModified).slice(0, 10)})`);
      }
    }
  }
  return { missing, outdated };
}

export function report({ missing, outdated }) {
  if (missing.length === 0 && outdated.length === 0) {
    console.log('English texts: all present and translated from the current Latvian texts.');
    return;
  }
  if (missing.length) console.log(`English texts missing:\n${missing.map((m) => `  - ${m}`).join('\n')}`);
  if (outdated.length) {
    console.log(
      `English texts older than their Latvian source:\n${outdated.map((m) => `  - ${m}`).join('\n')}`,
    );
    console.log('After revising a translation, copy the Latvian `wpModified` into its `translatedFrom`.');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) report(await checkTranslations());
