import { expect, test } from '@playwright/test';
import { PAGES } from './pages';

test('the icons and other files named in the page head exist', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="preload"], link[rel="stylesheet"]')
    .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
  expect(hrefs.length).toBeGreaterThanOrEqual(6);
  for (const href of hrefs) expect((await request.get(href)).ok(), href).toBe(true);
});

test('every page ends with the address to write to', async ({ page }) => {
  await page.goto('/');
  const contact = await page.locator('main a[href^="mailto:"]').last().getAttribute('href');
  for (const { path } of PAGES) {
    await page.goto(path);
    const address = page.locator('footer a[href^="mailto:"]');
    await expect(address, path).toHaveCount(1);
    await expect(address, path).toHaveAttribute('href', contact!);
    await expect(address, path).toContainText(contact!.replace('mailto:', ''));
  }
});

test('an address of the old WordPress site leads to the new page', async ({ page }) => {
  await page.goto('/WordPress/lettonia/');
  await expect(page).toHaveURL(/\/studentu-korporacijas\/lettonia\/$/);
  await page.goto('/WordPress/pk-vesture/');
  await expect(page).toHaveURL(/\/pk-vesture\/$/);
});

test('every link to a page of this site leads somewhere', async ({
  page,
  request,
  isMobile,
  browserName,
}) => {
  test.skip(isMobile || browserName !== 'chromium', 'the links are the same in every browser');

  const links = new Set<string>();
  for (const { path } of PAGES) {
    await page.goto(path);
    for (const href of await page
      .locator('a[href^="/"]')
      .evaluateAll((anchors) =>
        anchors.map((anchor) => new URL((anchor as HTMLAnchorElement).href).pathname),
      )) {
      links.add(href);
    }
  }

  const broken: string[] = [];
  for (const href of links) {
    const response = await request.get(href);
    if (!response.ok()) broken.push(`${response.status()} ${href}`);
  }
  expect(links.size).toBeGreaterThan(40);
  expect(broken).toEqual([]);
});
