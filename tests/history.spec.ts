import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const histories = [
  { path: '/pk-vesture/', contents: 'Šajā stāstā', archive: 'Lasīt pilno vēstures tekstu' },
  { path: '/vesture/', contents: 'Šajā stāstā', archive: 'Lasīt pilno vēstures tekstu' },
  { path: '/en/pk-vesture/', contents: 'In this story', archive: 'Read the full history' },
  { path: '/en/vesture/', contents: 'In this story', archive: 'Read the full history' },
];

for (const { path, contents, archive } of histories) {
  test(`${path} lets a reader explore an era, jump to its chapter and open the full text`, async ({
    page,
  }) => {
    await page.goto(path);
    const explorer = page.locator('[data-era-explorer]');
    const choices = explorer.locator('[data-era-select]');
    await expect(choices.first()).toHaveAttribute('aria-pressed', 'true');
    await choices.first().focus();
    await page.keyboard.press('End');
    await expect(choices.last()).toBeFocused();
    await expect(choices.last()).toHaveAttribute('aria-pressed', 'true');
    await expect(explorer.locator('[data-era-panel]:visible')).toHaveCount(1);
    const chapterLink = explorer.locator('[data-era-panel]:visible a');
    const hash = await chapterLink.getAttribute('href');
    await chapterLink.click();
    await expect(page).toHaveURL(new RegExp(`${hash}$`));
    const guide = page.getByRole('navigation', { name: contents });
    await expect(guide.locator('a[aria-current="location"]')).toHaveAttribute('href', hash!);
    await page.getByText(archive, { exact: true }).click();
    await expect(page.locator('.history-archive-text')).toBeVisible();
    await expect(page.locator('.history-archive-text')).not.toBeEmpty();
    const term = page.locator('.history-terms details').first();
    await term.locator('summary').focus();
    await page.keyboard.press('Space');
    await expect(term.locator('p')).toBeVisible();
  });
}

test('the homepage timeline supports year selection, next and previous, and chapter links', async ({
  page,
}) => {
  await page.goto('/');
  const explorer = page.locator('.history-home [data-era-explorer]');
  const choices = explorer.locator('[data-era-select]');
  await choices.nth(1).click();
  await expect(explorer.locator('[data-era-panel]:visible')).toContainText('1920');
  await explorer.getByRole('button', { name: 'Nākamais posms' }).click();
  await expect(explorer.locator('[data-era-panel]:visible')).toContainText('1940');
  await explorer.getByRole('button', { name: 'Iepriekšējais posms' }).click();
  await expect(choices.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await explorer.locator('[data-era-panel]:visible a').click();
  await expect(page).toHaveURL(/\/pk-vesture\/#kopdarbiba$/);
});

test('history and the original text remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const { path, archive } of histories.slice(0, 2)) {
    await page.goto(path);
    await expect(page.locator('[data-era-panel]:visible')).toHaveCount(5);
    await expect(page.locator('.history-chapter')).toHaveCount(5);
    await page.getByText(archive, { exact: true }).click();
    await expect(page.locator('.history-archive-text')).toBeVisible();
    await expect(page.locator('.history-archive-text p').first()).toBeVisible();
  }
  await context.close();
});

test('expanded history content passes accessibility checks with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const { path, archive } of histories.slice(0, 2)) {
    await page.goto(path);
    await page.locator('[data-era-select]').last().click();
    await expect(page.locator('[data-era-panel]:visible')).toHaveCSS('animation-name', 'none');
    await page.getByText(archive, { exact: true }).click();
    await page.locator('.history-terms summary').first().click();
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

test('changing years keeps the timeline in place on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const path of ['/', '/vesture/', '/en/vesture/']) {
    await page.goto(path);
    const explorer = page.locator('[data-era-explorer]');
    const track = explorer.locator('.era-track');
    await expect(explorer).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => document.fonts.ready);
    const initialTop = await track.evaluate(
      (element) =>
        element.getBoundingClientRect().top -
        element.closest('[data-era-explorer]')!.getBoundingClientRect().top,
    );
    for (const choice of await explorer.locator('[data-era-select]').all()) {
      await choice.click();
      const top = await track.evaluate(
        (element) =>
          element.getBoundingClientRect().top -
          element.closest('[data-era-explorer]')!.getBoundingClientRect().top,
      );
      expect(Math.abs(top - initialTop), path).toBeLessThan(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(320);
    }
  }
});
