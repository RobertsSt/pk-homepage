import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatEventCount, formatYears } from './labels.ts';

describe('counting in Latvian', () => {
  it('uses the singular after a number ending in 1, except 11', () => {
    assert.equal(formatYears(1, 'lv'), '1 gads');
    assert.equal(formatYears(21, 'lv'), '21 gads');
    assert.equal(formatYears(101, 'lv'), '101 gads');
    assert.equal(formatEventCount(1, 'lv'), '1 notikums');
    assert.equal(formatEventCount(31, 'lv'), '31 notikums');
  });

  it('uses the plural everywhere else', () => {
    assert.equal(formatYears(11, 'lv'), '11 gadi');
    assert.equal(formatYears(111, 'lv'), '111 gadi');
    assert.equal(formatYears(124, 'lv'), '124 gadi');
    assert.equal(formatEventCount(2, 'lv'), '2 notikumi');
    assert.equal(formatEventCount(11, 'lv'), '11 notikumi');
  });
});

describe('counting in English', () => {
  it('uses the singular for one only', () => {
    assert.equal(formatYears(1, 'en'), '1 year');
    assert.equal(formatYears(21, 'en'), '21 years');
    assert.equal(formatEventCount(1, 'en'), '1 event');
    assert.equal(formatEventCount(3, 'en'), '3 events');
  });
});
