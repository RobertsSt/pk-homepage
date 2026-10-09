import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { contrast, DEEPEST_PAPER, readableOnPaper } from './contrast.ts';

describe('contrast between two colours', () => {
  it('runs from 1 for the same colour to 21 for black on white', () => {
    assert.equal(contrast('#c9a348', '#c9a348'), 1);
    assert.equal(Math.round(contrast('#000000', '#ffffff')), 21);
  });

  it('does not depend on which colour is named first, or on the case of the letters', () => {
    assert.equal(contrast('#2E3880', '#f5f1e8'), contrast('#f5f1e8', '#2e3880'));
  });

  it('agrees with the figure WCAG gives for mid grey on white', () => {
    // #767676 is the lightest grey that passes 4.5 on white.
    assert.equal(contrast('#767676', '#ffffff').toFixed(2), '4.54');
  });
});

describe('a colour offered as the accent', () => {
  it('is measured against the deepest paper the stylesheet has', () => {
    const stylesheet = readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8');
    assert.equal(/--color-paper-deep:\s*(#[0-9a-f]{6})/i.exec(stylesheet)?.[1], DEEPEST_PAPER);
  });

  it('passes when it is as dark as the blue of Ventonia or the blue of Fraternitas Lettica', () => {
    assert.equal(readableOnPaper('#2e3880'), true);
    assert.equal(readableOnPaper('#2c4590'), true);
  });

  it('fails when it is a colour that only looks strong: gold, a light green, the red of Latvia', () => {
    assert.equal(readableOnPaper('#c9a348'), false);
    assert.equal(readableOnPaper('#98c070'), false);
    assert.equal(readableOnPaper('#c84c51'), false);
  });
});
