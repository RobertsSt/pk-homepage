import type { CSSProperties } from 'react';
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

const UPCOMING_COUNT = 5;
const EVENTS_PER_DAY = 2;

/**
 * The bar beside an event: a fraternity's three colours, top to bottom, for
 * its anniversary. Other events take their colour from the stylesheet.
 */
function marker(event: CalendarEvent, colors: Props['colors']): CSSProperties | undefined {
  const fraternity = event.fraternityId ? colors[event.fraternityId] : undefined;
  if (!fraternity) return undefined;
  const [top, middle, bottom] = fraternity.colors;
  return {
    '--marker': `linear-gradient(${top} 0 33.4%, ${middle} 33.4% 66.7%, ${bottom} 66.7%)`,
  } as CSSProperties;
}

/** The month with its events written into the days, beside a list of what comes next. */
export function Calendar({ events, colors, locale, strings, builtOn, subscribeUrl }: Props) {
  const calendar = useCalendar(events, builtOn);
  const { today, month, selected } = calendar;

  const listed = selected ? (calendar.byDay.get(selected) ?? []) : calendar.upcoming.slice(0, UPCOMING_COUNT);
  const heading = selected ? longDate(locale, selected) : strings['calendar.upcoming'];

  return (
    <div className="grid gap-x-16 gap-y-14 lg:grid-cols-12">
      <div className="order-2 lg:order-1 lg:col-span-7">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-2xl first-letter:uppercase sm:text-3xl" aria-live="polite">
            {monthTitle(locale, month)}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" className="link mr-2 text-sm" onClick={calendar.goToToday}>
              {strings['calendar.today']}
            </button>
            <button
              type="button"
              className="cal-step"
              onClick={calendar.goBack}
              disabled={!calendar.canGoBack}
              aria-label={strings['calendar.previous']}
            >
              ←
            </button>
            <button
              type="button"
              className="cal-step"
              onClick={calendar.goForward}
              disabled={!calendar.canGoForward}
              aria-label={strings['calendar.next']}
            >
              →
            </button>
          </div>
        </div>

        <table className="mt-6 w-full table-fixed border-collapse border-b border-rule">
          <thead>
            <tr>
              {weekdayNames(locale).map((name) => (
                <th
                  key={name}
                  scope="col"
                  className="px-1.5 pb-3 text-center text-[0.65rem] font-semibold tracking-[0.16em] text-ink-soft uppercase md:text-left"
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
                  const titles = dayEvents.map((event) => eventTitle(event, locale, strings));
                  return (
                    <td key={day} className="p-0 align-top">
                      <button
                        type="button"
                        className="cal-cell"
                        data-today={day === today ? '' : undefined}
                        data-selected={day === selected ? '' : undefined}
                        data-outside={monthOf(day).month === month.month ? undefined : ''}
                        aria-pressed={day === selected}
                        aria-label={`${longDate(locale, day)}${titles.length ? `: ${titles.join('; ')}` : ''}`}
                        onClick={() => calendar.select(day === selected ? null : day)}
                      >
                        <span className="cal-number">{dayNumber(day)}</span>
                        {dayEvents.slice(0, EVENTS_PER_DAY).map((event, i) => (
                          <span
                            key={event.id}
                            className="cal-event"
                            data-kind={event.kind}
                            style={marker(event, colors)}
                          >
                            {/* In the narrow cell an anniversary shows just the name. */}
                            {event.kind === 'anniversary' ? (event.subject ?? titles[i]) : titles[i]}
                          </span>
                        ))}
                        {dayEvents.length > EVENTS_PER_DAY && (
                          <span className="hidden pl-2 text-[0.68rem] text-ink-soft md:block">
                            +{dayEvents.length - EVENTS_PER_DAY}
                          </span>
                        )}
                        {dayEvents.length > 0 && (
                          <span className="cal-dots" aria-hidden="true">
                            {dayEvents.slice(0, 3).map((event) => (
                              <i key={event.id} data-kind={event.kind} style={marker(event, colors)} />
                            ))}
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="order-1 lg:order-2 lg:col-span-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3
            className="text-xs font-semibold tracking-[0.22em] text-ink-soft uppercase lg:pt-3"
            aria-live="polite"
          >
            {heading}
          </h3>
          {selected && (
            <button type="button" className="link text-sm" onClick={() => calendar.select(null)}>
              {strings['calendar.upcoming']}
            </button>
          )}
        </div>

        {listed.length === 0 ? (
          <p className="mt-5 border-t border-rule py-8 text-ink-soft">
            {strings[selected ? 'calendar.empty' : 'calendar.none']}
          </p>
        ) : (
          <ol className="mt-5">
            {listed.map((event) => {
              const day = selected ?? dateOf(event.start);
              const fraternity = event.fraternityId ? colors[event.fraternityId] : undefined;
              return (
                <li
                  key={event.id}
                  className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-4 border-t border-rule py-4 sm:gap-5"
                >
                  <time dateTime={event.start} className="text-center">
                    <span className="block font-display text-[2.5rem] leading-none">{dayNumber(day)}</span>
                    <span className="mt-1 block text-[0.66rem] font-semibold tracking-[0.2em] text-ink-soft uppercase">
                      {monthShort(locale, day)}
                    </span>
                  </time>
                  <div>
                    <p className="font-display text-xl leading-snug">{eventTitle(event, locale, strings)}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {[weekdayLong(locale, day), timeOf(event.start), shortLocation(event.location)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  {fraternity ? (
                    <Shield
                      colors={fraternity.colors}
                      band={fraternity.band}
                      className="h-10 w-auto text-ink/60"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`mr-3 size-2.5 rounded-full ${event.kind === 'meeting' ? 'bg-wine' : 'bg-ink/25'}`}
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
    </div>
  );
}
