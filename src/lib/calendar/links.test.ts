import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addToGoogleUrl, mapUrl } from './links.ts';
import type { CalendarEvent } from './types.ts';

const meeting: CalendarEvent = {
  id: 'a:2026-10-06T19:00',
  title: 'P!K! sēde',
  start: '2026-10-06T19:00',
  end: '2026-10-06T22:00',
  allDay: false,
  location: 'Šarlotes iela 3, Centra rajons, Rīga, LV-1001, Latvija',
  kind: 'meeting',
};

const anniversary: CalendarEvent = {
  id: 'b:2026-10-20',
  title: '1902. g. dibināta Fraternitas Lettica',
  start: '2026-10-20',
  allDay: true,
  kind: 'anniversary',
};

describe('a link that copies one entry into Google Calendar', () => {
  it('sends a timed entry with its Riga times, its place and the time zone', () => {
    const url = new URL(addToGoogleUrl(meeting));
    assert.equal(url.origin + url.pathname, 'https://calendar.google.com/calendar/render');
    assert.equal(url.searchParams.get('action'), 'TEMPLATE');
    assert.equal(url.searchParams.get('text'), 'P!K! sēde');
    assert.equal(url.searchParams.get('dates'), '20261006T190000/20261006T220000');
    assert.equal(url.searchParams.get('ctz'), 'Europe/Riga');
    assert.equal(url.searchParams.get('location'), meeting.location);
    assert.equal(url.searchParams.has('details'), false);
  });

  it('ends an all-day entry on the morning after, as Google counts it', () => {
    assert.equal(new URL(addToGoogleUrl(anniversary)).searchParams.get('dates'), '20261020/20261021');
    const twoDays = { ...anniversary, end: '2026-10-21' };
    assert.equal(new URL(addToGoogleUrl(twoDays)).searchParams.get('dates'), '20261020/20261022');
  });

  it('gives an entry without an end one hour, also across midnight', () => {
    const open = { ...meeting, end: undefined };
    assert.equal(new URL(addToGoogleUrl(open)).searchParams.get('dates'), '20261006T190000/20261006T200000');
    const late = { ...open, start: '2026-12-31T23:30' };
    assert.equal(new URL(addToGoogleUrl(late)).searchParams.get('dates'), '20261231T233000/20270101T003000');
  });

  it('carries the description when there is one', () => {
    const url = new URL(addToGoogleUrl({ ...meeting, description: 'Ierašanās no plkst. 18.30' }));
    assert.equal(url.searchParams.get('details'), 'Ierašanās no plkst. 18.30');
  });
});

describe('a link to a map', () => {
  it('searches for the place as the calendar writes it, on one line', () => {
    const url = new URL(mapUrl('VEF Kultūras Pils\nRopažu iela 2, Rīga 1039, Latvija'));
    assert.equal(url.origin + url.pathname, 'https://www.google.com/maps/search/');
    assert.equal(url.searchParams.get('api'), '1');
    assert.equal(url.searchParams.get('query'), 'VEF Kultūras Pils Ropažu iela 2, Rīga 1039, Latvija');
  });
});
