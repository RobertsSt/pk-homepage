#!/usr/bin/env node
/**
 * Serves the built site (dist/) for the browser tests, the way a plain static
 * host would: a folder address gives its index.html, a missing one gives the
 * 404 page.
 *
 *   node tests/serve.mjs [port]
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const PORT = Number(process.argv[2] ?? 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

/** The file a request path stands for, or `undefined` if there is none. */
function resolve(urlPath) {
  const file = path.join(ROOT, path.normalize(decodeURIComponent(urlPath)));
  if (!file.startsWith(ROOT)) return undefined;
  const candidate = existsSync(file) && statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
  return existsSync(candidate) && statSync(candidate).isFile() ? candidate : undefined;
}

if (!existsSync(path.join(ROOT, 'index.html'))) {
  console.error('dist/ is missing or empty: run `npm run build` first.');
  process.exit(1);
}

createServer((request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://localhost');
  const file = resolve(pathname) ?? path.join(ROOT, '404.html');
  response.writeHead(resolve(pathname) ? 200 : 404, {
    'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(response);
}).listen(PORT, () => console.log(`Serving dist/ at http://localhost:${PORT}`));
