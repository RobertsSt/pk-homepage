import { expect, test } from '@playwright/test';

/**
 * A row of the list is one link to the fraternity's page, stretched over the
 * whole row, with the contacts as links of their own on top of it. Both have
 * to keep working: a contact that the row's link covered could not be pressed.
 */
test('a row of the fraternity list shows insignia and contacts, and still leads to its page', async ({
  page,
}) => {
  await page.goto('/studentu-korporacijas/');
  const rows = page.locator('main ol > li');
  expect(await rows.count()).toBeGreaterThan(20);

  // Any row that gives an e-mail address will do.
  const row = rows.filter({ has: page.locator('a[href^="mailto:"]') }).first();
  await row.scrollIntoViewIfNeeded();
  await expect(row).toHaveClass(/is-visible/);
  const name = (await row.locator('a').first().innerText()).trim();
  const insignia = row.locator('ul[aria-label]');
  await expect(insignia.getByRole('img')).toHaveCount(4);

  // What is on top where a finger would land on the contact: the contact itself.
  for (const contact of await row.locator('address a').all()) {
    const reachable = await contact.evaluate((link) => {
      const box = link.getBoundingClientRect();
      const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return top === link || link.contains(top);
    });
    expect(reachable, (await contact.getAttribute('href')) ?? '').toBe(true);
  }
  const website = row.locator('address a[target="_blank"]');
  if (await website.count()) await expect(website.locator('.sr-only')).not.toBeEmpty();

  // A press anywhere else on the row, here on the insignia, opens the fraternity's page.
  const box = (await insignia.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('main h1')).toHaveText(name);
});
