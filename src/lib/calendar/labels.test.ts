import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatEventCount, formatYears, placeName, timeRange } from './labels.ts';

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

describe('the time of an event', () => {
  it('runs from start to end when both fall on the same day', () => {
    assert.equal(timeRange({ start: '2026-10-06T19:00', end: '2026-10-06T22:00' }), '19:00–22:00');
  });

  it('is the start alone when there is no end, or the end is on another day', () => {
    assert.equal(timeRange({ start: '2026-10-06T19:00' }), '19:00');
    assert.equal(timeRange({ start: '2026-10-06T23:00', end: '2026-10-07T02:00' }), '23:00');
  });

  it('is nothing for an all-day event', () => {
    assert.equal(timeRange({ start: '2026-10-20' }), undefined);
    assert.equal(timeRange({ start: '2026-10-20', end: '2026-10-21' }), undefined);
  });
});

describe('the place of an event on one line', () => {
  it('keeps the street and the town and drops the district, postcode and country', () => {
    assert.equal(
      placeName('Šarlotes iela 3, Centra rajons, Rīga, LV-1001, Latvija'),
      'Šarlotes iela 3, Rīga',
    );
    assert.equal(
      placeName('Filozofu iela 9, Jelgava, LV-3001, Latvijas Republika'),
      'Filozofu iela 9, Jelgava',
    );
    assert.equal(
      placeName(
        'Latvijas Nacionālā bibliotēka, Mūkusalas iela 3, Zemgales priekšpilsēta, Rīga, LV-1423, Latvija',
      ),
      'Latvijas Nacionālā bibliotēka, Mūkusalas iela 3, Rīga',
    );
  });

  it('keeps a place written in a few words as it is', () => {
    assert.equal(
      placeName('Fraternitas Imantica K!Dz!, Kungu iela 8, Jelgava'),
      'Fraternitas Imantica K!Dz!, Kungu iela 8, Jelgava',
    );
    assert.equal(placeName('LU Lielā aula'), 'LU Lielā aula');
    assert.equal(
      placeName('VEF Kultūras Pils\nRopažu iela 2, Rīga 1039, Latvija'),
      'VEF Kultūras Pils, Ropažu iela 2, Rīga 1039',
    );
  });

  it('is nothing when the calendar names no place', () => {
    assert.equal(placeName(undefined), undefined);
    assert.equal(placeName('  '), undefined);
  });
});
