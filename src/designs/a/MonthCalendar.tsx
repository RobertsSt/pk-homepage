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
const CHIPS_PER_DAY = 2;

/** Design A's calendar: a full month grid with the next events listed beside it. */
export function MonthCalendar({ events, colors, locale, strings, builtOn, subscribeUrl }: Props) {
  const calendar = useCalendar(events, builtOn);
  const { today, month, selected } = calendar;

  const listed = selected ? (calendar.byDay.get(selected) ?? []) : calendar.upcoming.slice(0, UPCOMING_COUNT);
  const heading = selected ? longDate(locale, selected) : strings['calendar.upcoming'];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="overflow-hidden rounded-xs border border-cloud bg-white shadow-[0_24px_60px_-40px_rgb(12_17_29/0.45)]">
        <div className="flex items-center justify-between gap-3 bg-night px-4 py-3.5 text-white sm:px-6">
          <button
            type="button"
            className="cal-step"
            onClick={calendar.goBack}
            disabled={!calendar.canGoBack}
            aria-label={strings['calendar.previous']}
          >
            ←
          </button>
          <p className="font-display text-lg first-letter:uppercase sm:text-xl" aria-live="polite">
            {monthTitle(locale, month)}
          </p>
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

        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              {weekdayNames(locale).map((name) => (
                <th
                  key={name}
                  scope="col"
                  className="border-b border-cloud py-2.5 text-[0.66rem] font-semibold tracking-[0.18em] text-slate uppercase"
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
                  const inMonth = monthOf(day).month === month.month;
                  return (
                    <td key={day} className="border-t border-l border-cloud p-0 align-top first:border-l-0">
                      <button
                        type="button"
                        className="cal-day"
                        data-state={day === selected ? 'selected' : undefined}
                        data-today={day === today ? '' : undefined}
                        data-outside={inMonth ? undefined : ''}
                        aria-pressed={day === selected}
                        aria-label={`${longDate(locale, day)}${titles.length ? `: ${titles.join('; ')}` : ''}`}
                        onClick={() => calendar.select(day === selected ? null : day)}
                      >
                        <span className="cal-number">{dayNumber(day)}</span>
                        {dayEvents.slice(0, CHIPS_PER_DAY).map((event, i) => (
                          <span key={event.id} className="cal-chip" data-kind={event.kind}>
                            {/* In the narrow cell an anniversary shows just the name. */}
                            {event.kind === 'anniversary' ? (event.subject ?? titles[i]) : titles[i]}
                          </span>
                        ))}
                        {dayEvents.length > CHIPS_PER_DAY && (
                          <span className="hidden text-[0.68rem] text-slate md:block">
                            +{dayEvents.length - CHIPS_PER_DAY}
                          </span>
                        )}
                        {dayEvents.length > 0 && (
                          <span className="cal-dots" aria-hidden="true">
                            {dayEvents.slice(0, 3).map((event) => (
                              <i key={event.id} data-kind={event.kind} />
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

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-2xl text-ink first-letter:uppercase" aria-live="polite">
            {heading}
          </h3>
          {selected && (
            <button
              type="button"
              className="text-sm font-semibold text-gold-deep underline-offset-4 hover:underline"
              onClick={calendar.goToToday}
            >
              {strings['calendar.upcoming']}
            </button>
          )}
        </div>

        {listed.length === 0 ? (
          <p className="mt-5 text-slate">{strings[selected ? 'calendar.empty' : 'calendar.none']}</p>
        ) : (
          <ol className="mt-5 space-y-3">
            {listed.map((event) => {
              const day = selected ?? dateOf(event.start);
              const fraternity = event.fraternityId ? colors[event.fraternityId] : undefined;
              return (
                <li
                  key={event.id}
                  className="flex items-center gap-4 rounded-xs border border-cloud bg-white p-3.5"
                >
                  <time
                    dateTime={event.start}
                    className="grid h-14 w-14 shrink-0 place-content-center rounded-xs bg-night text-center text-white"
                  >
                    <span className="font-display text-xl leading-none">{dayNumber(day)}</span>
                    <span className="mt-1 text-[0.6rem] font-semibold tracking-[0.16em] text-gold uppercase">
                      {monthShort(locale, day)}
                    </span>
                  </time>
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug font-semibold text-ink">
                      {eventTitle(event, locale, strings)}
                    </p>
                    <p className="mt-0.5 text-sm text-slate">
                      {[weekdayLong(locale, day), timeOf(event.start), shortLocation(event.location)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  {fraternity && (
                    <Shield
                      colors={fraternity.colors}
                      band={fraternity.band}
                      className="h-9 w-auto shrink-0 text-ink/55"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <a className="btn btn-line mt-6" href={subscribeUrl} target="_blank" rel="noreferrer">
          {strings['calendar.subscribe']} ↗
        </a>
      </div>
    </div>
  );
}
