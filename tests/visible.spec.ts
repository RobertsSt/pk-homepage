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
  for (const path of [
    '/',
    '/studentu-korporacijas/fraternitas-metropolitana/',
    '/latvijas-korporaciju-apvieniba/',
    '/pk-vesture/',
    '/vesture/',
    '/en/vesture/',
  ]) {
    await page.goto(path);
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
