import { expect, test } from '@playwright/test';

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
