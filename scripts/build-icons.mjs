#!/usr/bin/env node
/**
 * Draws the site's icons (the picture in a browser tab, a bookmark, a phone's
 * home screen) from the crest.
 *
 *   npm run build:icons
 *
 * The results are committed (public/), so this only needs running again when
 * the crest or the colours change.
 *
 * The crest is ink on a tile of the site's paper colour. A tile is needed
 * because many people use a dark browser, where ink alone would vanish. In a
 * tab the icon is 16 to 32 pixels across, far too small for an engraving, so
 * the small sizes fill the tile and have their lines strengthened.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CREST = path.join(ROOT, 'src/assets/site/crest-ink.png');
const OUT = path.join(ROOT, 'public');

// The same colours as in src/styles/global.css.
const PAPER = '#f5f1e8';
const INK = { r: 23, g: 21, b: 15 };

/**
 * One icon as a PNG.
 * `padding` is the margin around the crest, as a share of the size.
 * `boost` multiplies the opacity of the ink; above 1 it thickens faint lines.
 * `radius` rounds the corners of the tile, as a share of the size.
 */
async function icon(size, { padding, boost, radius }) {
  const inner = Math.round(size * (1 - 2 * padding));
  const ink = await sharp(CREST)
    .resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extractChannel('alpha')
    .linear(boost, 0)
    .toBuffer();
  const crest = await sharp({ create: { width: inner, height: inner, channels: 3, background: INK } })
    .joinChannel(ink)
    .png()
    .toBuffer();

  const layers = [{ input: crest, gravity: 'centre' }];
  if (radius > 0) {
    const r = Math.round(size * radius);
    const corners = `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="#fff"/></svg>`;
    layers.push({ input: Buffer.from(corners), blend: 'dest-in' });
  }
  return sharp({ create: { width: size, height: size, channels: 4, background: PAPER } })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Packs PNG images into one .ico file, the format every browser looks for at
 * /favicon.ico. The file is a short table of contents followed by the images.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = header.length + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0); // width
    entry.writeUInt8(size, 1); // height
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

const small = { padding: 0.03, boost: 2.4, radius: 0.2 };
const large = { padding: 0.1, boost: 1.2, radius: 0.2 };

const files = {
  // Browser tabs and bookmarks.
  'favicon.ico': ico(
    await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await icon(size, small) }))),
  ),
  // Larger uses, such as a shortcut on an Android home screen.
  'icon-192.png': await icon(192, large),
  // iPhone and iPad home screens. They round the corners themselves.
  'apple-touch-icon.png': await icon(180, { ...large, radius: 0 }),
};

for (const [name, data] of Object.entries(files)) {
  await writeFile(path.join(OUT, name), data);
  console.log(`${name.padEnd(22)} ${(data.length / 1024).toFixed(1)} KB`);
}
