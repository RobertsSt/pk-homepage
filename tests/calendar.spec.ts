import { expect, test } from '@playwright/test';
import { calendarReady } from './pages';

/** The day a number of days after `YYYY-MM-DD`. */
const addDays = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

test('the calendar week starts on Monday', async ({ page }) => {
  await page.goto('/');
  const grid = await calendarReady(page);
  await expect(grid.locator('thead th').first()).toHaveText('Pr');
  await expect(grid.locator('thead th').last()).toHaveText('Sv');

  await page.goto('/en/');
  const english = await calendarReady(page);
  await expect(english.locator('thead th').first()).toHaveText('Mon');
});

test('the month is a single stop for the Tab key and arrow keys move through it', async ({ page }) => {
  await page.goto('/');
  const grid = await calendarReady(page);
  const focused = page.locator(':focus');

  const stop = grid.locator('button[tabindex="0"]');
  await expect(stop).toHaveCount(1);
  const start = (await stop.getAttribute('data-day'))!;

  await stop.focus();
  await page.keyboard.press('ArrowRight');
  await expect(focused).toHaveAttribute('data-day', addDays(start, 1));
  await page.keyboard.press('ArrowDown');
  await expect(focused).toHaveAttribute('data-day', addDays(start, 8));
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  await expect(focused).toHaveAttribute('data-day', start);

  // Still one stop, and it has followed the keyboard.
  await page.keyboard.press('ArrowRight');
  await expect(grid.locator('button[tabindex="0"]')).toHaveCount(1);
  await expect(grid.locator('button[tabindex="0"]')).toHaveAttribute('data-day', addDays(start, 1));
});

test('Page Down turns to the next month and keeps the keyboard in the grid', async ({ page }) => {
  await page.goto('/');
  const grid = await calendarReady(page);
  const title = page.locator(`[id="${await grid.getAttribute('aria-labelledby')}"]`);
  const before = await title.textContent();

  await grid.locator('button[tabindex="0"]').focus();
  await page.keyboard.press('PageDown');
  await expect(title).not.toHaveText(before!);
  await expect(page.locator(':focus')).toHaveAttribute('data-day', /^\d{4}-\d{2}-\d{2}$/);
});

test('picking a day lists its events and says so', async ({ page }) => {
  await page.goto('/');
  const grid = await calendarReady(page);
  const stop = grid.locator('button[tabindex="0"]');
  const label = (await stop.getAttribute('aria-label'))!;

  await stop.focus();
  await page.keyboard.press('Enter');
  await expect(grid.locator('[role="gridcell"][aria-selected="true"]')).toHaveCount(1);
  // "Šodien, ceturtdiena, 8. oktobris: …" → the date without the events or the word for today.
  const date = label.split(':')[0]!.replace(/^Šodien, /, '');
  await expect(page.getByRole('status')).toContainText(date);

  await page.keyboard.press('Enter');
  await expect(grid.locator('[role="gridcell"][aria-selected="true"]')).toHaveCount(0);
});

test("an event in the list opens to a link that copies it into one's own calendar", async ({ page }) => {
  await page.goto('/');
  await calendarReady(page);
  const entry = page.locator('.cal-entry').first();
  const copy = entry.locator('a[href^="https://calendar.google.com/calendar/render"]');
  await expect(copy).toBeHidden();

  await entry.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(copy).toBeVisible();
  await expect(copy).toHaveAttribute('target', '_blank');
  await expect(copy.locator('.sr-only')).not.toBeEmpty();

  const link = new URL((await copy.getAttribute('href'))!);
  expect(link.searchParams.get('action')).toBe('TEMPLATE');
  expect(link.searchParams.get('text')).toBeTruthy();
  // A day, or a day and a time, for both the start and the end.
  expect(link.searchParams.get('dates')).toMatch(/^\d{8}(T\d{6})?\/\d{8}(T\d{6})?$/);
  expect(link.searchParams.get('ctz')).toBe('Europe/Riga');

  // Where the calendar names a place, the entry leads to it on a map.
  for (const map of await page.locator('.cal-entry a[href*="/maps/search/"]').all()) {
    expect(new URL((await map.getAttribute('href'))!).searchParams.get('query')).toBeTruthy();
  }
});
