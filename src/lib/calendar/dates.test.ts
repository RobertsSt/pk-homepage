import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { locales } from '../../i18n/config.ts';
import {
  addDays,
  dayForKey,
  monthGrid,
  shiftMonth,
  weekdayIndex,
  weekdayNames,
  type YearMonth,
} from './dates.ts';

/** Real weekday of a date, from the platform: 1 = Monday … 7 = Sunday. */
const isoWeekday = (dateKey: string) => new Date(`${dateKey}T00:00:00Z`).getUTCDay() || 7;

describe('the week starts on Monday', () => {
  it('names Monday first in every language', () => {
    assert.equal(weekdayNames('lv')[0], 'Pr');
    assert.equal(weekdayNames('en')[0], 'Mon');
    for (const locale of locales) assert.equal(weekdayNames(locale).length, 7);
  });

  it('numbers Monday as the first day', () => {
    assert.equal(weekdayIndex('2026-10-05'), 0); // a Monday
    assert.equal(weekdayIndex('2026-10-11'), 6); // the Sunday that ends that week
  });

  it('starts every row of every month view on a Monday', () => {
    // Twelve years covers every arrangement of weekdays and leap years.
    let month: YearMonth = { year: 2020, month: 1 };
    for (let i = 0; i < 144; i += 1, month = shiftMonth(month, 1)) {
      for (const week of monthGrid(month)) {
        assert.equal(week.length, 7);
        assert.equal(isoWeekday(week[0]!), 1, `${week[0]} should be a Monday`);
        assert.equal(isoWeekday(week[6]!), 7, `${week[6]} should be a Sunday`);
      }
    }
  });
});

describe('monthGrid', () => {
  it('shows October 2026 from Monday 28 September to Sunday 1 November', () => {
    const weeks = monthGrid({ year: 2026, month: 10 });
    assert.equal(weeks.length, 5);
    assert.equal(weeks[0]![0], '2026-09-28');
    assert.equal(weeks.at(-1)!.at(-1), '2026-11-01');
  });

  it('contains every day of the month exactly once, in order', () => {
    const days = monthGrid({ year: 2028, month: 2 }).flat();
    for (let i = 1; i < days.length; i += 1) assert.equal(days[i], addDays(days[i - 1]!, 1));
    assert.equal(days.filter((day) => day.startsWith('2028-02-')).length, 29);
  });
});

describe('keys in the month grid', () => {
  it('moves by a day with the left and right arrows, across months and years', () => {
    assert.equal(dayForKey('ArrowRight', '2026-10-08'), '2026-10-09');
    assert.equal(dayForKey('ArrowLeft', '2026-10-01'), '2026-09-30');
    assert.equal(dayForKey('ArrowRight', '2026-12-31'), '2027-01-01');
  });

  it('moves by a week with the up and down arrows', () => {
    assert.equal(dayForKey('ArrowDown', '2026-10-08'), '2026-10-15');
    assert.equal(dayForKey('ArrowUp', '2026-10-05'), '2026-09-28');
  });

  it('goes to the Monday and the Sunday of the week with Home and End', () => {
    assert.equal(dayForKey('Home', '2026-10-08'), '2026-10-05');
    assert.equal(dayForKey('End', '2026-10-08'), '2026-10-11');
    assert.equal(dayForKey('Home', '2026-10-05'), '2026-10-05');
    assert.equal(dayForKey('End', '2026-10-11'), '2026-10-11');
  });

  it('turns the month with Page Up and Page Down, stopping at the end of a shorter month', () => {
    assert.equal(dayForKey('PageDown', '2026-10-08'), '2026-11-08');
    assert.equal(dayForKey('PageUp', '2026-01-15'), '2025-12-15');
    assert.equal(dayForKey('PageDown', '2026-01-31'), '2026-02-28');
    assert.equal(dayForKey('PageDown', '2028-01-31'), '2028-02-29');
    assert.equal(dayForKey('PageUp', '2026-03-31'), '2026-02-28');
  });

  it('leaves every other key alone', () => {
    for (const key of ['Enter', ' ', 'Tab', 'a', 'Escape'])
      assert.equal(dayForKey(key, '2026-10-08'), undefined);
  });
});
