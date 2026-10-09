import type { Page } from '@playwright/test';

/** One page of each kind, in both languages where the two differ. */
export const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'English homepage', path: '/en/' },
  { name: 'P!K! history', path: '/pk-vesture/' },
  { name: 'fraternity history', path: '/vesture/' },
  { name: 'English P!K! history', path: '/en/pk-vesture/' },
  { name: 'short text page', path: '/rekviziti/' },
  { name: 'English text page', path: '/en/vesture/' },
  { name: 'fraternity list', path: '/studentu-korporacijas/' },
  { name: 'fraternity page with photographs', path: '/studentu-korporacijas/lettonia/' },
  { name: 'fraternity page without photographs', path: '/studentu-korporacijas/talavija/' },
  { name: 'English fraternity page', path: '/en/studentu-korporacijas/selonija/' },
  { name: 'image credits', path: '/attelu-avoti/' },
  { name: 'page for a missing address', path: '/no-such-page/' },
] as const;

/** Scrolls to the foot of the page in steps, as a reader would, and back to the top. */
export async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    // Long enough for the browser to draw and to report what has come into view.
    const pause = () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 40))),
      );
    // The site scrolls smoothly; a test has no time for that.
    const jump = (top: number) => window.scrollTo({ top, behavior: 'instant' });
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight * 0.7) {
      jump(y);
      await pause();
    }
    jump(document.documentElement.scrollHeight);
    await pause();
    jump(0);
  });
}

/** Waits until the calendar has become interactive. */
export async function calendarReady(page: Page) {
  const grid = page.getByRole('grid');
  await grid.scrollIntoViewIfNeeded();
  await page.locator('astro-island:not([ssr])').first().waitFor({ state: 'attached' });
  return grid;
}
