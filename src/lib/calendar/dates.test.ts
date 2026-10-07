import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { locales } from '../../i18n/config.ts';
import { addDays, monthGrid, shiftMonth, weekdayIndex, weekdayNames, type YearMonth } from './dates.ts';

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
