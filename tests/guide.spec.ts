import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const guides = [
  {
    path: '/kas-ir-studentu-korporacijas/',
    contents: 'Šajā lapā',
    section: 'Krāsas un simboli',
    fullText: 'Lasīt pilno tekstu',
    lastWords: 'kas sekos šiem principiem.',
    sources: 'Avoti',
  },
  {
    path: '/en/kas-ir-studentu-korporacijas/',
    contents: 'On this page',
    section: 'Colours and symbols',
    fullText: 'Read the complete text',
    lastWords: 'lose his worth.',
    sources: 'Sources',
  },
];

for (const { path, contents, section, fullText, lastWords, sources } of guides) {
  test(`${path} leads to its sections, answers a question and holds the complete text`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('main h1')).toHaveCount(1);

    // The list under the introduction jumps to a section.
    await page.getByRole('navigation', { name: contents }).getByRole('link', { name: section }).click();
    await expect(page).toHaveURL(/#simboli$/);
    await expect(page.getByRole('heading', { level: 2, name: section })).toBeInViewport();

    // A question opens from the keyboard.
    const question = page.locator('#jautajumi details').first();
    await question.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(question.locator('p')).toBeVisible();

    // Nothing of the text the page is drawn from is lost: it is there to its last sentence.
    await page.getByText(fullText, { exact: true }).click();
    const text = page.locator('#pilnais-teksts ~ details .prose');
    await expect(text).toBeVisible();
    await expect(text).toContainText(lastWords);
    await expect(text.locator('pre')).toHaveCount(0);
    expect(await text.locator('p').count()).toBeGreaterThan(10);

    // Every source that has an address opens in a new tab, and says so.
    const links = page.getByRole('region', { name: sources }).getByRole('link');
    expect(await links.count()).toBeGreaterThanOrEqual(4);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link.locator('.sr-only')).not.toBeEmpty();
    }
  });
}

test('the insignia are shown on the fraternity that presides this year', async ({ page }) => {
  await page.goto('/');
  // The homepage names the presiding fraternity beside the academic year.
  const presiding = (await page.locator('dd:has(svg)').first().innerText()).trim();
  await page.goto('/kas-ir-studentu-korporacijas/');
  const example = page.locator('#simboli figure');
  await expect(example).toContainText(presiding);
  await expect(example.locator('img')).toHaveCount(4);
  await example.getByRole('link').click();
  await expect(page.locator('main h1')).toHaveText(presiding);
});

test('Latvian terms are marked as Latvian on the English guide', async ({ page }) => {
  await page.goto('/en/kas-ir-studentu-korporacijas/');
  const terms = page.locator('#vardnica dt');
  expect(await terms.count()).toBeGreaterThan(5);
  for (const term of await terms.all()) await expect(term).toHaveAttribute('lang', 'lv');
});

test('the guide is complete without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/kas-ir-studentu-korporacijas/');
  await expect(page.locator('main h2')).toHaveCount(9);
  await expect(page.locator('#principi li').first()).toBeVisible();
  await page.locator('#jautajumi summary').first().click();
  await expect(page.locator('#jautajumi details p').first()).toBeVisible();
  await context.close();
});

test('the guide with everything opened passes the accessibility checks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const { path } of guides) {
    await page.goto(path);
    for (const summary of await page.locator('main details > summary').all()) await summary.click();
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      violations.map(
        (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
      ),
      path,
    ).toEqual([]);
  }
});
