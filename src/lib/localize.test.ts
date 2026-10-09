import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inLanguage } from './localize.ts';

describe('picking one language out of content written in two', () => {
  const content = {
    name: 'Kas ir studentu korporācijas?',
    title: { lv: 'Vārdnīca', en: 'Glossary' },
    photo: {
      src: { src: '/_astro/a.webp', width: 10, height: 5, format: 'webp' },
      alt: { lv: 'Gājiens', en: 'Procession' },
    },
    items: [{ title: { lv: 'Gods', en: 'Honour' }, order: 3 }],
    url: undefined,
  };

  it('replaces every pair, however deep, and leaves the rest alone', () => {
    const latvian = inLanguage(content, 'lv');
    assert.equal(latvian.title, 'Vārdnīca');
    assert.equal(latvian.photo.alt, 'Gājiens');
    assert.deepEqual(latvian.items, [{ title: 'Gods', order: 3 }]);
    assert.equal(latvian.name, content.name);
    assert.equal(inLanguage(content, 'en').items[0]!.title, 'Honour');
  });

  it('hands a picture on as the very same object', () => {
    assert.equal(inLanguage(content, 'en').photo.src, content.photo.src);
  });

  it('does not mistake an object that merely has the two keys among others', () => {
    const mixed = { lv: 'a', en: 'b', other: 'c' };
    assert.deepEqual(inLanguage(mixed, 'lv'), mixed);
  });
});
