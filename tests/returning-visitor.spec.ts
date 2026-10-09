import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, test } from '@playwright/test';
import { serve } from './serve.mjs';

/**
 * While WordPress stood at pk.lv, the address pk.lv itself answered "moved
 * permanently to /WordPress/" without saying for how long, and a browser keeps
 * such an answer for good. If the new site sent /WordPress/ back to the
 * homepage, everyone who had been to pk.lv before would be passed back and
 * forth until the browser gave up with "too many redirects".
 *
 * This test is that returning visitor: one browser, first on a server that
 * answers as WordPress did, then on the same address serving the new site.
 */
test('a browser that remembers the old move to /WordPress/ still reaches the homepage', async ({
  browser,
}) => {
  let wordpressIsHere = true;
  const asked: string[] = [];
  const server = createServer((request, response) => {
    const { pathname } = new URL(request.url ?? '/', 'http://localhost');
    if (!wordpressIsHere) {
      asked.push(pathname);
      serve(request, response);
    } else if (pathname === '/') {
      response.writeHead(301, { Location: '/WordPress/' }).end();
    } else {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end('<title>WordPress</title>');
    }
  });
  await new Promise<void>((listening) => server.listen(0, listening));
  const origin = `http://localhost:${(server.address() as AddressInfo).port}`;
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/`);
    await expect(page).toHaveURL(`${origin}/WordPress/`);

    wordpressIsHere = false; // the switch
    await page.goto(`${origin}/`);
    await expect(page).toHaveURL(`${origin}/`);
    await expect(page.locator('main h1')).toBeVisible();

    // The browser has been put right: its next visit goes straight to the homepage.
    asked.length = 0;
    await page.goto(`${origin}/`);
    await expect(page).toHaveURL(`${origin}/`);
    expect(asked).not.toContain('/WordPress/');
  } finally {
    await context.close();
    server.close();
  }
});

test('the old homepage address is the homepage itself, and names the real one', async ({ browser }) => {
  // Without scripts nothing moves the visitor on, so what is served there can be looked at.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/WordPress/');
  await expect(page).toHaveURL(/\/WordPress\/$/);
  await expect(page.locator('main h1')).toBeVisible();
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(new URL(canonical!).pathname).toBe('/');
  await context.close();
});

test('with scripts the old homepage address moves on to the homepage', async ({ page }) => {
  await page.goto('/WordPress/');
  await expect(page).toHaveURL(/^[^/]+\/\/[^/]+\/$/);
});
