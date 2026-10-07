import { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  dateOf,
  monthGrid,
  monthOf,
  shiftMonth,
  todayInRiga,
  type YearMonth,
} from '@/lib/calendar/dates';
import type { CalendarEvent } from '@/lib/calendar/types';

/** How far the month view may be paged; matches the range the build fetches. */
const MONTHS_BACK = 1;
const MONTHS_AHEAD = 13;

const monthIndex = ({ year, month }: YearMonth) => year * 12 + month;

/**
 * State shared by the calendar views of every design: which month is shown,
 * which day is picked, and the events grouped by day.
 *
 * The page is built ahead of time, so it first renders for the build date and
 * then switches to the visitor's actual "today".
 */
export function useCalendar(events: CalendarEvent[], builtOn: string) {
  const [today, setToday] = useState(builtOn);
  const [month, setMonth] = useState<YearMonth>(() => monthOf(builtOn));
  const [selected, setSelected] = useState<string | null>(null);

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

  const offset = monthIndex(month) - monthIndex(monthOf(today));

  return {
    today,
    month,
    weeks: monthGrid(month),
    byDay,
    upcoming,
    selected,
    select: (day: string | null) => setSelected(day),
    canGoBack: offset > -MONTHS_BACK,
    canGoForward: offset < MONTHS_AHEAD,
    goBack: () => setMonth((current) => shiftMonth(current, -1)),
    goForward: () => setMonth((current) => shiftMonth(current, 1)),
    goToToday: () => {
      setMonth(monthOf(today));
      setSelected(null);
    },
  };
}

/** "Šarlotes iela 3, Centra rajons, Rīga, LV-1001, Latvija" → "Šarlotes iela 3" */
export const shortLocation = (location: string | undefined) => location?.split(',')[0]?.trim();
