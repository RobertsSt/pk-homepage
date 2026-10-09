import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { findTraps, trapAdvice } from './markdown-traps.ts';

const problems = (markdown: string) => findTraps(markdown).map(({ line, problem }) => `${line} ${problem}`);

describe('text that Markdown would not show as written', () => {
  it('finds a paragraph indented with spaces or a tab', () => {
    assert.deepEqual(problems('Pirmā rindkopa.\n\n       Visi četri principi ir vienādi svarīgi.'), [
      '3 indented',
    ]);
    assert.deepEqual(problems('\tAr tabulatoru.'), ['1 indented']);
  });

  it('lets an indented line carry on the paragraph or the list item before it', () => {
    assert.deepEqual(problems('Rinda beidzas šeit,\\\n       un turpinās ar atkāpi.'), []);
    assert.deepEqual(problems('1. Pirmais\n\n    turpinājums tajā pašā punktā\n\n2. Otrais'), []);
  });

  it('finds a paragraph that opens with a year', () => {
    assert.deepEqual(problems('Ievads.\n\n1922. gada 8. februārī korporācija atjauno darbību.'), [
      '3 numbered',
    ]);
    assert.deepEqual(problems('27. septembrī piecas korporācijas dibina apvienību.'), ['1 numbered']);
  });

  it('accepts the same sentence once the full stop is escaped, or inside a paragraph', () => {
    assert.deepEqual(problems('1922\\. gada 8. februārī korporācija atjauno darbību.'), []);
    assert.deepEqual(problems('Tas notika\n1922. gada 8. februārī.'), []);
  });

  it('accepts a list numbered from 1, tight or with blank lines between the items', () => {
    assert.deepEqual(problems('1. Curonia\n2. Fraternitas Rigensis\n3. Fraternitas Baltica'), []);
    assert.deepEqual(problems('Saraksts:\n\n1. Curonia\n\n2. Fraternitas Rigensis\n\nPēc saraksta.'), []);
  });

  it('finds a paragraph that a list before it would swallow as its next item', () => {
    assert.deepEqual(problems('1. Curonia\n\n2. Fraternitas Rigensis\n\n1990. gadā darbību atjauno.'), [
      '5 numbered',
    ]);
  });

  it('finds a block of code, and ignores the facts at the head of a file', () => {
    assert.deepEqual(problems('---\ntitle: Lapa\n    indented: no\n---\n\nTeksts.\n\n```\nkods\n```'), [
      '8 fenced',
    ]);
  });
});

describe('the long texts of the site', () => {
  it('hold nothing that would be drawn as code or as a list numbered from a year', () => {
    const content = new URL('../content/', import.meta.url);
    const found = readdirSync(content, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.md'))
      .sort()
      .flatMap((file) =>
        findTraps(readFileSync(new URL(file, content), 'utf8')).map(
          (trap) => `src/content/${file}:${trap.line} "${trap.text}" ${trapAdvice[trap.problem]}`,
        ),
      );
    assert.deepEqual(found, []);
  });
});
