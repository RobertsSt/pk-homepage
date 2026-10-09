import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  addDays,
  dateOf,
  monthGrid,
  monthOf,
  shiftMonth,
  todayInRiga,
  toDateKey,
  type YearMonth,
} from '@/lib/calendar/dates';
import type { CalendarEvent } from '@/lib/calendar/types';

/** How far the month view may be paged; matches the range the build fetches. */
const MONTHS_BACK = 1;
const MONTHS_AHEAD = 13;

const monthIndex = ({ year, month }: YearMonth) => year * 12 + month;

/**
 * State shared by the calendar views: which month is shown, which day is
 * picked, which day the keyboard is on, and the events grouped by day.
 *
 * The page is built ahead of time, so it first renders for the build date and
 * then switches to the visitor's actual "today".
 */
export function useCalendar(events: CalendarEvent[], builtOn: string) {
  const [today, setToday] = useState(builtOn);
  const [month, setMonth] = useState<YearMonth>(() => monthOf(builtOn));
  const [selected, setSelected] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);

  useEffect(() => {
    const now = todayInRiga();
    setToday(now);
    setMonth(monthOf(now));
  }, []);

  const byDay = useMemo(() => {
    const days = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const last = dateOf(event.end ?? event.start);
      for (let day = dateOf(event.start); day <= last; day = addDays(day, 1)) {
        days.set(day, [...(days.get(day) ?? []), event]);
      }
    }
    return days;
  }, [events]);

  const upcoming = useMemo(
    () => events.filter((event) => dateOf(event.end ?? event.start) >= today),
    [events, today],
  );

  const weeks = useMemo(() => monthGrid(month), [month]);

  // Keys can arrive faster than the grid is redrawn, so the month the keyboard
  // has asked for is also kept where the next key press can read it at once.
  const askedMonth = useRef(month);
  askedMonth.current = month;
  const offsetOf = (target: YearMonth) => monthIndex(target) - monthIndex(monthOf(today));
  const offset = offsetOf(month);
  const inRange = (target: YearMonth) => offsetOf(target) >= -MONTHS_BACK && offsetOf(target) <= MONTHS_AHEAD;

  // The grid is one stop in the tab order; arrow keys move within it. The stop
  // is the day the keyboard was last on, else the picked day, else today, else
  // the first of the month, whichever of those the month on screen shows.
  const shown = new Set(weeks.flat());
  const tabStop =
    [cursor, selected].find((day) => day && shown.has(day)) ??
    (monthIndex(monthOf(today)) === monthIndex(month) ? today : toDateKey(month.year, month.month, 1));

  return {
    today,
    month,
    weeks,
    byDay,
    upcoming,
    selected,
    tabStop,
    select: (day: string | null) => {
      setSelected(day);
      if (day) setCursor(day);
    },
    canGoBack: offset > -MONTHS_BACK,
    canGoForward: offset < MONTHS_AHEAD,
    goBack: () => {
      setMonth((current) => shiftMonth(current, -1));
      setCursor(null);
    },
    goForward: () => {
      setMonth((current) => shiftMonth(current, 1));
      setCursor(null);
    },
    goToToday: () => {
      setMonth(monthOf(today));
      setSelected(null);
      setCursor(null);
    },
    /**
     * Puts the keyboard on a day, turning to its month if the grid does not
     * show it. Returns false when the day lies outside the months on offer.
     */
    moveTo: (day: string) => {
      if (!monthGrid(askedMonth.current).flat().includes(day)) {
        if (!inRange(monthOf(day))) return false;
        askedMonth.current = monthOf(day);
        setMonth(monthOf(day));
      }
      setCursor(day);
      return true;
    },
  };
}
