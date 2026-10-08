import { expect, test } from '@playwright/test';

test.describe('the main menu on a wide screen', () => {
  test.skip(({ isMobile }) => isMobile, 'the wide layout only');

  test('opens from the keyboard, closes on Escape and hands focus back', async ({ page }) => {
    await page.goto('/');
    const menu = page.getByRole('navigation', { name: 'Izvēlne' });
    const button = menu.getByRole('button', { name: 'Prezidiju Konvents' });
    const link = menu.getByRole('link', { name: 'P!K! vēsture' });

    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(link).toBeHidden();

    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(link).toBeVisible();

    await link.focus();
    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
    await expect(link).toBeHidden();
  });

  test('closes when focus moves on to another group', async ({ page }) => {
    await page.goto('/');
    const menu = page.getByRole('navigation', { name: 'Izvēlne' });
    const first = menu.getByRole('button', { name: 'Prezidiju Konvents' });
    const second = menu.getByRole('button', { name: 'Aktivitātes' });

    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await second.focus();
    await expect(first).toHaveAttribute('aria-expanded', 'false');
  });

  test('a mouse pointer over a group shows its links', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'hover media queries are not emulated in this WebKit build');
    await page.goto('/');
    const menu = page.getByRole('navigation', { name: 'Izvēlne' });
    await menu.getByRole('button', { name: 'Aktivitātes' }).hover();
    await menu.getByRole('link', { name: 'Baltijas tautu komeršs' }).click();
    await expect(page).toHaveURL(/\/baltijas-tautu-komerss\/$/);
  });
});

test.describe('the main menu on a phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'the narrow layout only');

  test('opens as a dialog, closes on Escape and leads to a page', async ({ page }) => {
    await page.goto('/');
    const opener = page.getByRole('button', { name: 'Izvēlne' });
    const dialog = page.getByRole('dialog', { name: 'Izvēlne' });

    await opener.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();

    await opener.click();
    await dialog.getByRole('link', { name: 'P!K! mērķi' }).click();
    await expect(page).toHaveURL(/\/pk-merki\/$/);
  });
});

test('the language switch leads to the same page in the other language', async ({ page }) => {
  await page.goto('/studentu-korporacijas/lettonia/');
  await page
    .getByRole('navigation', { name: 'Valoda' })
    .getByRole('link', { name: /English/ })
    .click();
  await expect(page).toHaveURL(/\/en\/studentu-korporacijas\/lettonia\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
