import { expect, test } from '@playwright/test';
import { PAGES, scrollThrough } from './pages';

/**
 * Content fades in as it is scrolled to. These tests make sure that it always
 * does arrive: an element that waits for a signal that never comes would leave
 * a blank space where text should be.
 */

/** Elements that are still waiting to appear. */
const waiting = () =>
  [...document.querySelectorAll<HTMLElement>('[data-reveal], [data-enter]')]
    .filter((element) =>
      element.hasAttribute('data-reveal')
        ? !element.classList.contains('is-visible')
        : Number(getComputedStyle(element).opacity) < 1,
    )
    .map((element) => `${element.tagName.toLowerCase()}.${element.className}`);

for (const { name, path } of PAGES) {
  test(`nothing stays hidden on the ${name}`, async ({ page }) => {
    await page.goto(path);
    await scrollThrough(page);
    await expect.poll(() => page.evaluate(waiting)).toEqual([]);
  });
}

/**
 * Heraldry is a scan on white, mixed into the paper behind it. While its row
 * fades in, the row is all it can be mixed with, so the row has to be paper
 * itself (`.sheet` in global.css); otherwise the white shows until the row has
 * arrived. Returns the pictures whose nearest group has no solid ground.
 */
const onBareWhite = () => {
  const solid = (colour: string) => {
    const alpha = /(?:\/|rgba\([^)]*,)\s*([\d.]+)(%?)\s*\)$/.exec(colour);
    return !alpha || Number(alpha[1]) === (alpha[2] ? 100 : 1);
  };
  return [...document.querySelectorAll<HTMLElement>('.on-paper')]
    .filter((picture) => {
      for (let element = picture.parentElement; element; element = element.parentElement) {
        const style = getComputedStyle(element);
        if (style.isolation === 'isolate') return !solid(style.backgroundColor);
      }
      return true;
    })
    .map((picture) => picture.getAttribute('alt') ?? picture.className);
};

test('heraldry never shows the white it was scanned on', async ({ page }) => {
  let pictures = 0;
  for (const { path } of PAGES) {
    await page.goto(path);
    pictures += await page.locator('.on-paper').count();
    expect(await page.evaluate(onBareWhite), path).toEqual([]);
  }
  // The list, the fraternities' own pages and the guide all show heraldry.
  expect(pictures).toBeGreaterThan(100);
});

test('a long article can be read as soon as its page opens', async ({ page }) => {
  await page.goto('/pk-vesture/');
  await expect(page.locator('.history-intro')).toHaveCSS('opacity', '1');
  await expect(page.locator('.history-intro')).toBeInViewport();
});

test('all content shows without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const path of ['/', '/studentu-korporacijas/lettonia/']) {
    await page.goto(path);
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-reveal], [data-enter]')]
        .filter((element) => getComputedStyle(element).opacity !== '1' && !element.getAnimations().length)
        .map((element) => element.className),
    );
    expect(hidden).toEqual([]);
  }
  await context.close();
});

test('the page does not scroll sideways on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  // One page of every kind, and the fraternity with the longest name.
  const paths = [...PAGES.map(({ path }) => path), '/studentu-korporacijas/fraternitas-metropolitana/'];
  for (const path of paths) {
    await page.goto(path);
    // A paragraph typed with an indent would be drawn as a box of code as wide as its longest line.
    expect(await page.locator('main pre').count(), path).toBe(0);
    // A heading may not run past the space it is given either; it would be cut off there.
    const overflowing = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('h1')]
        .filter((heading) => {
          const box = heading.getBoundingClientRect();
          const texts = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
          for (let node = texts.nextNode(); node; node = texts.nextNode()) {
            const letters = document.createRange();
            letters.selectNodeContents(node);
            for (const rect of letters.getClientRects()) {
              if (rect.right > box.right + 2 || rect.left < box.left - 2) return true;
            }
          }
          return false;
        })
        .map((heading) => heading.textContent?.trim()),
    );
    expect(overflowing, path).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(320);
  }
});
