#!/usr/bin/env node
/**
 * Repeatable one-way import of the published WordPress site into this repo.
 *
 *   npm run import:wordpress
 *
 * Reads pages and media through the public REST API and writes Latvian
 * Markdown/YAML under src/content and images under src/assets.
 *
 * Rules that keep re-runs safe:
 *  - Latvian text always comes from WordPress and is overwritten on every run.
 *  - Facts WordPress does not hold (colours, founding dates, larger heraldry,
 *    chosen photographs, descriptions of photographs, corrections) live in
 *    scripts/import-overrides.json and are merged in on every run.
 *  - English files (src/content/**\/en/) are never touched. The import ends
 *    by listing the ones whose Latvian source has changed since they were
 *    translated.
 *
 * The script is retired at cutover, once WordPress stops being the source.
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';
import sharp from 'sharp';
import TurndownService from 'turndown';
import { stringify } from 'yaml';
import { checkTranslations, report as reportTranslations } from './check-translations.mjs';

const WP = 'https://pk.lv/WordPress';
const API = `${WP}/wp-json/wp/v2`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content');
const ASSETS = path.join(ROOT, 'src/assets');

/**
 * How content refers to a file in src/assets. The alias means the same from
 * any content file, however deep it sits, which is also what lets the editing
 * tool offer one picture library for all of them.
 */
const ASSET_ALIAS = '@/assets';

const HOME_SLUG = 'prezidiju-konvents';
const INDEX_SLUG = 'studentu-korporacijas';
const HERALDRY_SLOTS = ['shield', 'arms', 'zirkel', 'cap', 'star'];

/** Images that belong to the site chrome rather than to a page body. */
const SITE_ASSETS = {
  'hero-parade.webp': '2024/10/background-min-new-scaled.webp',
  'parade-wide.webp': '2024/03/MG_9001-scaled.webp',
  'procession.jpg': '2024/02/slide1.jpg',
  'fencing.jpg': '2024/02/slide3.jpg',
  'candles.webp': '2024/02/MG_7979-scaled.webp',
  'crest-engraving.jpg': '2024/10/historical-logo-min.jpg',
  'crest.png': '2024/10/1-logo-min.png',
  'officers/senior.jpg': '2025/12/NiksG.jpg',
  'officers/vice-senior.jpg': '2025/12/IMG_7905-1.jpg',
  'officers/secretary.jpg': '2025/12/AgnisS.jpg',
};

const warnings = [];
const warn = (msg) => warnings.push(msg);

// ---------------------------------------------------------------------------
// Fetching

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return { data: await res.json(), headers: res.headers };
}

async function fetchAll(endpoint, fields) {
  const items = [];
  for (let page = 1; ; page += 1) {
    const url = `${API}/${endpoint}?per_page=100&page=${page}&_fields=${fields}`;
    const { data, headers } = await fetchJson(url);
    items.push(...data);
    if (page >= Number(headers.get('x-wp-totalpages') ?? 1)) break;
  }
  return items;
}

async function exists(file) {
  try {
    return (await stat(file)).size > 0;
  } catch {
    return false;
  }
}

/** Downloads once; later runs reuse the file so re-imports stay quick. */
async function download(url, dest) {
  if (await exists(dest)) return;
  const res = await fetch(encodeURI(decodeURI(url)));
  if (!res.ok) {
    warn(`Could not download ${url} (${res.status})`);
    return;
  }
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

/** Corrections to imported text, keyed by file path below src/content. */
let textFixes = {};

async function writeText(file, text) {
  for (const [from, to] of textFixes[path.relative(CONTENT, file)] ?? []) {
    if (text.includes(from)) text = text.replaceAll(from, to);
    else warn(`${path.relative(CONTENT, file)}: correction no longer applies, "${from}" was not found`);
  }
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text.endsWith('\n') ? text : `${text}\n`);
}

// ---------------------------------------------------------------------------
// HTML helpers

const clean = (text) =>
  text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?, ?(?=\S)/g, ', ')
    .trim();

/** Text of an element as lines, one per <br>. */
function lines(el) {
  const html = el.innerHTML.replace(/<br\s*\/?>/gi, '\n');
  return parse(html).text.split('\n').map(clean).filter(Boolean);
}

const extension = (url) => path.extname(new URL(url).pathname).toLowerCase().replace('.jpeg', '.jpg');

function createImageResolver(media) {
  const byId = new Map(media.map((m) => [m.id, m.source_url]));
  /** The original upload behind an <img>, never a resized variant. */
  return (img) => {
    const id = Number(/wp-image-(\d+)/.exec(img.getAttribute('class') ?? '')?.[1]);
    if (byId.has(id)) return byId.get(id);
    return img.getAttribute('src').replace(/-\d+x\d+(?=\.[a-z]+$)/i, '');
  };
}

const area = (img) => Number(img.getAttribute('width') ?? 0) * Number(img.getAttribute('height') ?? 0);

function createTurndown() {
  const td = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    emDelimiter: '*',
    hr: '---',
    br: '\\',
  });
  td.addRule('emptyParagraph', {
    filter: (node) => node.nodeName === 'P' && !node.textContent.trim() && !node.querySelector('img'),
    replacement: () => '',
  });
  // WordPress nests <strong><strong>; one level is enough.
  td.addRule('nestedStrong', {
    filter: (node) => node.nodeName === 'STRONG' && node.parentNode?.nodeName === 'STRONG',
    replacement: (content) => content,
  });
  return td;
}

const tidyMarkdown = (md) =>
  md
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .replace(/^(\s*)-\s{2,}/gm, '$1- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

function frontmatter(data) {
  return `---\n${stringify(data, { lineWidth: 0 }).trim()}\n---\n`;
}

// ---------------------------------------------------------------------------
// Fraternities

/** Reads one entry of the list page: name, mottos, contacts and heraldry. */
function parseListEntry(entry) {
  const [nameBlock, contactBlock] = entry.querySelectorAll('p');
  const [name, ...mottos] = lines(nameBlock);

  const website = contactBlock?.querySelector('a[href^="http"]');
  const mail = contactBlock?.querySelector('a[href^="mailto:"]');
  const email = mail?.getAttribute('href').replace('mailto:', '').trim();
  const linkTexts = new Set([website, mail].filter(Boolean).map((a) => clean(a.text)));

  let phone;
  const address = [];
  for (const raw of contactBlock ? lines(contactBlock) : []) {
    const line = raw.replace(/^(Tālr\.|E-pasts)\s*:\s*/i, '').trim();
    if (!line || linkTexts.has(line) || line === 'Latvija') continue;
    if (/^\+?[\d\s()-]{7,}$/.test(line)) phone = line.replace(/\s+/g, '');
    else address.push(line.replace(/,$/, ''));
  }

  return {
    name,
    mottos,
    website: website?.getAttribute('href'),
    address: address.join(', ') || undefined,
    phone,
    email,
    images: entry.querySelectorAll('figure img').slice(0, HERALDRY_SLOTS.length),
  };
}

function parseFraternityList(html) {
  const root = parse(html);
  return root.querySelectorAll('a.wp-block-button__link').map((link, index) => {
    let entry = link.parentNode;
    while (entry && !(entry.querySelector?.('strong') && entry.querySelector('figure')))
      entry = entry.parentNode;
    if (!entry) throw new Error(`No list entry found around ${link.getAttribute('href')}`);
    return {
      id: new URL(link.getAttribute('href')).pathname.split('/').filter(Boolean).pop(),
      order: index + 1,
      membership: link.closest('details') ? 'outside' : 'pk',
      ...parseListEntry(entry),
    };
  });
}

/**
 * Splits a fraternity page into its heraldry header and its body sections.
 * Two layouts exist: the older one (header, rule, plain paragraphs) and the
 * newer one (header, then columns pairing a photo with a titled text).
 */
function parseFraternityPage(html, name) {
  const root = parse(html);
  const top = root.childNodes.filter((n) => n.nodeType === 1);
  const headerIndex = top.findIndex((el) => el.querySelectorAll('img').length >= 4);
  const header = top[headerIndex];
  const body = top.slice(headerIndex + 1).filter((el) => el.tagName !== 'HR');
  for (const el of header?.querySelectorAll('hr') ?? []) el.remove();

  const sections = body.map((el) => {
    const heading = el.querySelector('h2, h3');
    const images = el.querySelectorAll('img');
    if (el.tagName === 'DIV' && heading && images.length === 1) {
      const title = clean(heading.text);
      heading.remove();
      for (const figure of el.querySelectorAll('figure')) figure.remove();
      return { title, image: images[0], html: el.innerHTML };
    }
    return { html: el.outerHTML };
  });

  return {
    heraldry: header?.querySelectorAll('img').slice(0, HERALDRY_SLOTS.length) ?? [],
    sections: sections.filter((s) => s.title !== name || s.image),
  };
}

async function importFraternities(pages, resolveImage, overrides) {
  const td = createTurndown();
  const list = parseFraternityList(pages.get(INDEX_SLUG).content.rendered);

  for (const item of list) {
    const page = pages.get(item.id);
    if (!page) {
      warn(`${item.name}: list links to "${item.id}", which is not a published page`);
      continue;
    }
    const detail = parseFraternityPage(page.content.rendered, item.name);
    const assetDir = path.join(ASSETS, 'fraternities', item.id);
    const relAssetDir = `${ASSET_ALIAS}/fraternities/${item.id}`;

    // Heraldry: whichever of the two pages holds the larger file wins.
    const heraldry = {};
    for (const [i, slot] of HERALDRY_SLOTS.entries()) {
      const candidates = [item.images[i], detail.heraldry[i]].filter(Boolean);
      const best = candidates.sort((a, b) => area(b) - area(a))[0];
      if (!best) {
        warn(`${item.name}: no ${slot} image`);
        continue;
      }
      const url = resolveImage(best);
      const file = `${slot}${extension(url)}`;
      await download(url, path.join(assetDir, file));
      heraldry[slot] = `${relAssetDir}/${file}`;
    }

    // Body: titled sections keep their photo directly under the heading.
    const parts = [];
    let photo = 0;
    for (const section of detail.sections) {
      if (section.title) parts.push(`## ${section.title}`);
      if (section.image) {
        photo += 1;
        const url = resolveImage(section.image);
        const file = `photo-${photo}${extension(url)}`;
        await download(url, path.join(assetDir, file));
        // The description set in WordPress wins; the overrides fill in where there is none.
        const asset = `fraternities/${item.id}/${file}`;
        const alt = clean(section.image.getAttribute('alt') ?? '') || overrides.imageAlts?.[asset] || '';
        if (!alt) warn(`${item.name}: ${file} has no description for screen readers`);
        parts.push(`![${alt.replace(/[[\]]/g, '')}](${ASSET_ALIAS}/${asset})`);
      }
      const md = tidyMarkdown(td.turndown(section.html));
      if (md) parts.push(md);
    }
    if (!parts.length) warn(`${item.name}: page has no body text`);

    const { images: _images, id, ...facts } = item;
    const extra = overrides.fraternities?.[id] ?? {};
    // An override may replace single heraldry images, e.g. with a larger file.
    const data = { ...facts, ...extra, heraldry: { ...heraldry, ...extra.heraldry } };
    for (const key of ['website', 'address', 'phone', 'email']) if (!data[key]) delete data[key];
    await writeText(path.join(CONTENT, 'fraternities', `${id}.yaml`), stringify(data, { lineWidth: 0 }));
    await writeText(
      path.join(CONTENT, 'fraternity-texts/lv', `${id}.md`),
      // The title is not shown on the site; it names the text in the editing tool's list.
      `${frontmatter({ title: item.name, wpModified: page.modified })}\n${parts.join('\n\n')}`,
    );
  }
  return list;
}

// ---------------------------------------------------------------------------
// Text pages

async function importTextPages(pages, skip, resolveImage) {
  const td = createTurndown();
  const imported = [];
  for (const page of pages.values()) {
    if (skip.has(page.slug)) continue;
    const root = parse(page.content.rendered);
    for (const img of root.querySelectorAll('img')) {
      const url = resolveImage(img);
      const file = path.basename(new URL(url).pathname).toLowerCase();
      await download(url, path.join(ASSETS, 'pages', page.slug, file));
      img.setAttribute('src', `${ASSET_ALIAS}/pages/${page.slug}/${file}`);
      img.removeAttribute('srcset');
    }
    const title = clean(parse(page.title.rendered).text);
    const body = tidyMarkdown(td.turndown(root.innerHTML));
    await writeText(
      path.join(CONTENT, 'pages/lv', `${page.slug}.md`),
      `${frontmatter({ title, wpModified: page.modified })}\n${body}`,
    );
    imported.push(page.slug);
  }
  return imported;
}

// ---------------------------------------------------------------------------
// Derived assets

/**
 * The 1919 engraving arrives as black ink on a pale grey scan. This turns the
 * paper transparent so the crest can sit on any background and be recoloured.
 */
async function deriveCrest() {
  const source = path.join(ASSETS, 'site/crest-engraving.jpg');
  if (!(await exists(source))) return;
  const { data, info } = await sharp(source)
    .resize({ width: 1200 })
    .grayscale()
    .linear(255 / 244, 0) // lift the scan's grey paper to pure white
    .negate() // ink becomes opaque, paper transparent
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  await sharp({ create: { width, height, channels: 3, background: '#000000' } })
    .joinChannel(data, { raw: { width, height, channels: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS, 'site/crest-ink.png'));
}

// ---------------------------------------------------------------------------

async function main() {
  const overrides = JSON.parse(await readFile(path.join(ROOT, 'scripts/import-overrides.json'), 'utf8'));
  textFixes = overrides.textFixes ?? {};
  const [pageList, media] = await Promise.all([
    fetchAll('pages', 'id,slug,title,content,modified'),
    fetchAll('media', 'id,source_url'),
  ]);
  const pages = new Map(pageList.map((p) => [p.slug, p]));
  const resolveImage = createImageResolver(media);

  const fraternities = await importFraternities(pages, resolveImage, overrides);

  // A page that is not a fraternity page but shares a fraternity's name is a
  // leftover copy from an earlier layout (e.g. "selonija-3", "ventonia3").
  const fraternityIds = new Set(fraternities.map((f) => f.id));
  const leftovers = [...pages.keys()].filter(
    (slug) => !fraternityIds.has(slug) && fraternityIds.has(slug.replace(/-?\d+$/, '')),
  );
  const skip = new Set([HOME_SLUG, INDEX_SLUG, ...fraternityIds, ...leftovers]);
  const textPages = await importTextPages(pages, skip, resolveImage);

  for (const [file, upload] of Object.entries(SITE_ASSETS)) {
    await download(`${WP}/wp-content/uploads/${upload}`, path.join(ASSETS, 'site', file));
  }
  await deriveCrest();

  console.log(
    `Fraternities: ${fraternities.length} (${fraternities.filter((f) => f.membership === 'pk').length} in P!K!)`,
  );
  console.log(`Text pages:   ${textPages.length} (${textPages.join(', ')})`);
  console.log(`Skipped:      home, list, leftovers: ${leftovers.join(', ') || 'none'}`);
  if (warnings.length) console.log(`\nWarnings:\n${warnings.map((w) => `  - ${w}`).join('\n')}`);

  // A Latvian text that changed in WordPress leaves its English translation behind.
  console.log('');
  reportTranslations(await checkTranslations());
}

await main();
