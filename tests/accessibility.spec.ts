import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGES, scrollThrough } from './pages';

/**
 * Automated accessibility checks against WCAG 2.2 level AA. They find the
 * mechanical faults (contrast, missing names, invalid ARIA); the keyboard
 * paths have their own tests.
 */
for (const { name, path } of PAGES) {
  test(`the ${name} passes the automated accessibility checks`, async ({ page }) => {
    // With motion reduced everything is in its final place when it is examined.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    await scrollThrough(page);

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const summary = violations.flatMap((violation) =>
      violation.nodes.map((node) => `${violation.id}: ${node.target.join(' ')}`),
    );
    expect(summary).toEqual([]);
  });
}
