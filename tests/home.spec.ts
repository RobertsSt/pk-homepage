import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

/** The accent colour as an editor typed it into the homepage's content. */
const accent = /^ +accent: *['"]?(#[0-9a-f]{6})/im.exec(
  readFileSync(new URL('../src/content/site/home.yaml', import.meta.url), 'utf8'),
)![1]!;
const asRgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16)).join(', ')})`;

test('the lettering around the crest closes into a full ring', async ({ page }) => {
  await page.goto('/');
  // Browsers space text on a path differently (Safari ignores `textLength`),
  // so a script fits it. Once fitted, the space between the last letter and
  // the first is the same as between any two neighbours. The ring is 400
  // units across, so 3 units is well under a letter's width.
  await expect
    .poll(() =>
      page.evaluate(() => {
        const text = document.querySelector<SVGTextElement>('[data-seal-text]')!;
        const count = text.getNumberOfChars();
        const between = (from: number, to: number) => {
          const a = text.getEndPositionOfChar(from);
          const b = text.getStartPositionOfChar(to);
          return Math.hypot(a.x - b.x, a.y - b.y);
        };
        const gaps = Array.from({ length: count - 1 }, (_, i) => between(i, i + 1)).sort((a, b) => a - b);
        return Math.abs(between(count - 1, 0) - gaps[Math.floor(gaps.length / 2)]!);
      }),
    )
    .toBeLessThan(3);
});

test('the turning ring can be stopped and started again', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Apturēt zīmoga griešanos' });
  const playState = () =>
    page.evaluate(() => getComputedStyle(document.querySelector('[data-seal] svg')!).animationPlayState);

  expect(await playState()).toBe('running');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  expect(await playState()).toBe('paused');

  // The choice is remembered on the next visit.
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  expect(await playState()).toBe('running');
});

test('a shield in the row under the hero leads to its fraternity', async ({ page }) => {
  await page.goto('/');
  const row = page.getByRole('navigation', { name: 'Studentu korporācijas' });
  await expect(row.getByRole('link')).toHaveCount(20);
  await row.getByRole('link', { name: 'Selonija' }).click();
  await expect(page).toHaveURL(/\/studentu-korporacijas\/selonija\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Selonija');
});

test('every page takes its accent colour from the presidium in the content', async ({ page }) => {
  for (const path of ['/', '/en/', '/studentu-korporacijas/', '/no-such-page/']) {
    await page.goto(path);
    const onPage = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(),
    );
    expect(onPage, path).toBe(accent);
  }
  // And it reaches what is drawn: the second line of the name on the homepage.
  await page.goto('/');
  await expect(page.locator('h1 em')).toHaveCSS('color', asRgb(accent));
});

test('each officer is named, with a portrait or the silhouette that keeps its place', async ({ page }) => {
  await page.goto('/');
  const cards = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'P!K! amatpersonas' }) })
    .getByRole('listitem');
  expect(await cards.count()).toBeGreaterThan(0);
  for (const card of await cards.all()) {
    await expect(card.getByRole('heading')).not.toBeEmpty();
    await expect(card.locator('a[href^="mailto:"]')).toHaveCount(1);
    const portrait = card.locator('img');
    if (await portrait.count()) await expect(portrait).toHaveAttribute('alt', /\S/);
    else await expect(card.locator('svg[aria-hidden="true"]')).toHaveCount(1);
  }
});

test('the presiding fraternity and its shield fit beside the two numbers at every width', async ({
  page,
}) => {
  for (const width of [320, 640, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const fit = await page
      .locator('dd:has(> svg)')
      .first()
      .evaluate((figure) => {
        const cell = figure.parentElement!.getBoundingClientRect();
        const shield = figure.querySelector('svg')!.getBoundingClientRect();
        const letters = document.createRange();
        letters.selectNodeContents(figure.querySelector('span')!);
        const name = letters.getBoundingClientRect();
        return {
          shieldInside: cell.right - shield.right,
          shieldShape: shield.width / shield.height,
          nameInside: name.left - cell.left,
          between: shield.left - name.right,
          lines: figure.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(figure).fontSize),
        };
      });
    const at = `at ${width}px`;
    // The shield keeps its shape (100 by 116) and stays in the cell, clear of the name.
    expect(fit.shieldShape, at).toBeCloseTo(100 / 116, 1);
    expect(fit.shieldInside, at).toBeGreaterThanOrEqual(0);
    expect(fit.nameInside, at).toBeGreaterThanOrEqual(0);
    expect(fit.between, at).toBeGreaterThan(8);
    // However long the name, it is no taller than the numbers beside it.
    expect(fit.lines, at).toBeCloseTo(1, 1);
  }
});
