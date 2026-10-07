import { Shield } from '@/components/Shield';
import { shortLocation, useCalendar } from '@/components/calendar/useCalendar';
import type { Locale } from '@/i18n/config';
import type { UiKey } from '@/i18n/ui';
import {
  dateOf,
  dayNumber,
  longDate,
  monthOf,
  monthShort,
  monthTitle,
  timeOf,
  weekdayLong,
  weekdayNames,
} from '@/lib/calendar/dates';
import { eventTitle } from '@/lib/calendar/labels';
import type { CalendarEvent } from '@/lib/calendar/types';
import type { FraternityColors } from '@/lib/site';

interface Props {
  events: CalendarEvent[];
  colors: Record<string, FraternityColors>;
  locale: Locale;
  strings: Record<UiKey, string>;
  /** Riga date the page was built on. */
  builtOn: string;
  subscribeUrl: string;
}

const UPCOMING_COUNT = 6;

/** Design B's calendar: a reading list of what comes next, beside a small month to browse. */
export function Agenda({ events, colors, locale, strings, builtOn, subscribeUrl }: Props) {
  const calendar = useCalendar(events, builtOn);
  const { today, month, selected } = calendar;

  const listed = selected ? (calendar.byDay.get(selected) ?? []) : calendar.upcoming.slice(0, UPCOMING_COUNT);
  const heading = selected ? longDate(locale, selected) : strings['calendar.upcoming'];

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-7">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-xs font-semibold tracking-[0.22em] text-ink-soft uppercase" aria-live="polite">
            {heading}
          </h3>
          {selected && (
            <button type="button" className="link text-sm" onClick={() => calendar.select(null)}>
              {strings['calendar.upcoming']}
            </button>
          )}
        </div>

        {listed.length === 0 ? (
          <p className="mt-4 border-t border-rule py-8 text-ink-soft">
            {strings[selected ? 'calendar.empty' : 'calendar.none']}
          </p>
        ) : (
          <ol className="mt-4">
            {listed.map((event) => {
              const day = selected ?? dateOf(event.start);
              const time = timeOf(event.start);
              const place = shortLocation(event.location);
              const fraternity = event.fraternityId ? colors[event.fraternityId] : undefined;
              return (
                <li
                  key={event.id}
                  className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-4 border-t border-rule py-5 sm:grid-cols-[4.5rem_1fr_auto] sm:gap-6"
                >
                  <time dateTime={event.start} className="text-center">
                    <span className="block font-display text-4xl leading-none sm:text-5xl">
                      {dayNumber(day)}
                    </span>
                    <span className="mt-1.5 block text-[0.68rem] font-semibold tracking-[0.2em] text-ink-soft uppercase">
                      {monthShort(locale, day)}
                    </span>
                  </time>
                  <div>
                    <p className="font-display text-xl leading-snug sm:text-2xl">
                      {eventTitle(event, locale, strings)}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {[weekdayLong(locale, day), time, place].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {fraternity ? (
                    <Shield
                      colors={fraternity.colors}
                      band={fraternity.band}
                      className="h-11 w-auto text-ink/60"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`size-2.5 rounded-full ${event.kind === 'meeting' ? 'bg-wine' : 'bg-ink/25'}`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <a className="link mt-6 inline-block text-sm" href={subscribeUrl} target="_blank" rel="noreferrer">
          {strings['calendar.subscribe']} ↗
        </a>
      </div>

      <div className="lg:col-span-5">
        <div className="border border-rule bg-paper p-5 sm:p-7">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="month-step"
              onClick={calendar.goBack}
              disabled={!calendar.canGoBack}
              aria-label={strings['calendar.previous']}
            >
              ←
            </button>
            <p className="font-display text-xl first-letter:uppercase" aria-live="polite">
              {monthTitle(locale, month)}
            </p>
            <button
              type="button"
              className="month-step"
              onClick={calendar.goForward}
              disabled={!calendar.canGoForward}
              aria-label={strings['calendar.next']}
            >
              →
            </button>
          </div>

          <table className="mt-5 w-full table-fixed border-collapse text-center">
            <thead>
              <tr>
                {weekdayNames(locale).map((name) => (
                  <th
                    key={name}
                    scope="col"
                    className="pb-3 text-[0.65rem] font-semibold tracking-[0.16em] text-ink-soft uppercase"
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendar.weeks.map((week) => (
                <tr key={week[0]}>
                  {week.map((day) => {
                    const dayEvents = calendar.byDay.get(day) ?? [];
                    const inMonth = monthOf(day).month === month.month;
                    const state = day === selected ? 'selected' : day === today ? 'today' : 'plain';
                    return (
                      <td key={day} className="p-0.5">
                        <button
                          type="button"
                          className="day"
                          data-state={state}
                          data-outside={inMonth ? undefined : ''}
                          aria-pressed={day === selected}
                          aria-label={`${longDate(locale, day)}${dayEvents.length ? `: ${dayEvents.map((e) => eventTitle(e, locale, strings)).join('; ')}` : ''}`}
                          onClick={() => calendar.select(day === selected ? null : day)}
                        >
                          {dayNumber(day)}
                          {dayEvents.length > 0 && (
                            <span
                              aria-hidden="true"
                              className={`day-dot ${dayEvents.some((e) => e.kind === 'meeting') ? 'bg-wine' : 'bg-current opacity-45'}`}
                            />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <button type="button" className="link mt-4 text-sm" onClick={calendar.goToToday}>
            {strings['calendar.today']}
          </button>
        </div>
      </div>
    </div>
  );
}
