#!/usr/bin/env node
/**
 * Builds the site's web fonts from the full files published by Google Fonts.
 *
 *   npm run build:fonts
 *
 * A ready-made web font package splits each face into "latin" and "latin-ext"
 * files, and Latvian text needs both: about 490 KB for the three faces used
 * here. This keeps only the letters the site can be expected to show and fixes
 * the weight of each file, which brings the same three faces to about 170 KB.
 *
 * The results are committed (src/assets/fonts), so this only needs running
 * again when the list of characters, the weights or the fonts change. A
 * character outside the list still shows, in the visitor's system font.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/assets/fonts');

// Pinned to a commit so that a rebuild gives the same files.
const SOURCE = 'https://raw.githubusercontent.com/google/fonts';
const NEWSREADER = `${SOURCE}/8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5/ofl/newsreader`;
const INSTRUMENT_SANS = `${SOURCE}/0b58fb370093f9a9f4ff785d94405710b79de67c/ofl/instrumentsans`;

const range = (from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i)).join('');

/** Every character the fonts keep. */
const CHARACTERS = [
  range(0x20, 0x7e), // Basic Latin
  range(0xa0, 0xff), // Latin-1: Western European letters and common signs
  'ĀāČčĒēĢģĪīĶķĻļŅņŠšŪūŽž', // Latvian
  'ŌōŖŗ', // Latvian spelling before 1946, found in historical names
  'ĄąĘęĖėĮįŲų', // Lithuanian
  'ĆćŁłŃńŚśŹźŻż', // Polish
  '–—‘’‚“”„†‡•…‰′″‹›€™−',
  '←↑→↓↖↗↘↙',
].join('');

/**
 * `axes` fixes a variable axis to one value or narrows it to a range; an axis
 * that is not named keeps its full range. Newsreader keeps its optical size
 * axis, which is what draws headlines finer than body text.
 */
const FONTS = [
  {
    file: 'newsreader-400.woff2',
    source: `${NEWSREADER}/Newsreader%5Bopsz%2Cwght%5D.ttf`,
    axes: { wght: 400 },
  },
  {
    file: 'newsreader-600.woff2',
    source: `${NEWSREADER}/Newsreader%5Bopsz%2Cwght%5D.ttf`,
    axes: { wght: 600 },
  },
  {
    file: 'newsreader-italic-400.woff2',
    source: `${NEWSREADER}/Newsreader-Italic%5Bopsz%2Cwght%5D.ttf`,
    axes: { wght: 400 },
  },
  {
    file: 'instrument-sans.woff2',
    source: `${INSTRUMENT_SANS}/InstrumentSans%5Bwdth%2Cwght%5D.ttf`,
    axes: { wdth: 100 },
  },
];

/** Both fonts are under the SIL Open Font License, which must travel with them. */
const LICENCES = [
  { file: 'Newsreader-OFL.txt', source: `${NEWSREADER}/OFL.txt` },
  { file: 'InstrumentSans-OFL.txt', source: `${INSTRUMENT_SANS}/OFL.txt` },
];

const downloads = new Map();

/** Fetches a file once, however many fonts are cut from it. */
function download(url) {
  if (!downloads.has(url)) {
    downloads.set(
      url,
      fetch(url).then(async (response) => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
        return Buffer.from(await response.arrayBuffer());
      }),
    );
  }
  return downloads.get(url);
}

await mkdir(OUT, { recursive: true });

for (const { file, source, axes } of FONTS) {
  const font = await subsetFont(await download(source), CHARACTERS, {
    targetFormat: 'woff2',
    variationAxes: axes,
  });
  await writeFile(path.join(OUT, file), font);
  console.log(`${file.padEnd(30)} ${(font.length / 1024).toFixed(1)} KB`);
}

for (const { file, source } of LICENCES) {
  await writeFile(path.join(OUT, file), await download(source));
}
