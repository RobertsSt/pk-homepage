import { expect, test } from '@playwright/test';

test('the language switch leads to the same page in the other language', async ({ page }) => {
  await page.goto('/studentu-korporacijas/lettonia/');
  await page
    .getByRole('navigation', { name: 'Valoda' })
    .getByRole('link', { name: /English/ })
    .click();
  await expect(page).toHaveURL(/\/en\/studentu-korporacijas\/lettonia\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('English pages are in English', async ({ page }) => {
  for (const path of [
    '/en/pk-vesture/',
    '/en/studentu-korporacijas/lettonia/',
    '/en/studentu-korporacijas/selonija/',
  ]) {
    await page.goto(path);
    // Text that still awaits translation is shown in Latvian and marked as such.
    await expect(page.locator('main [lang="lv"]'), path).toHaveCount(0);
  }
  await page.goto('/en/pk-vesture/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('History of P!K!');
  await expect(page.locator('.prose')).toContainText(
    'the highest governing body of the student fraternities',
  );
});

test('a page says which language it is in', async ({ page }) => {
  await page.goto('/pk-vesture/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'lv');
  await page.goto('/en/pk-vesture/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
