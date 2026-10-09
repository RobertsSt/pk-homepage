import type { CSSProperties, TargetedKeyboardEvent } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';
import { Shield } from '@/components/Shield';
import { useCalendar } from '@/components/calendar/useCalendar';
import type { Locale } from '@/i18n/config';
import type { UiKey } from '@/i18n/ui';
import {
  dateOf,
  dayForKey,
  dayNumber,
  longDate,
  monthOf,
  monthShort,
  monthTitle,
  weekdayLong,
  weekdayNames,
} from '@/lib/calendar/dates';
import { eventTitle, formatEventCount, placeName, timeRange } from '@/lib/calendar/labels';
import { addToGoogleUrl, mapUrl } from '@/lib/calendar/links';
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
  return { '--marker': `linear-gradient(${top} 0 33.4%, ${middle} 33.4% 66.7%, ${bottom} 66.7%)` };
}

/**
 * The month with its events written into the days, beside a list of what
 * comes next.
 *
 * The month is a grid in the accessibility sense: it is one stop in the tab
 * order, arrow keys move from day to day (Home and End within the week, Page
 * Up and Page Down by month), and Enter or Space picks the day.
 */
export function Calendar({ events, colors, locale, strings, builtOn, subscribeUrl }: Props) {
  const calendar = useCalendar(events, builtOn);
  const { today, month, selected } = calendar;
  const titleId = useId();

  const listed = selected ? (calendar.byDay.get(selected) ?? []) : calendar.upcoming.slice(0, UPCOMING_COUNT);
  const heading = selected ? longDate(locale, selected) : strings['calendar.upcoming'];

  // An arrow key may lead to a day that is only drawn after the month has
  // turned, so keyboard focus is moved once the grid has been redrawn.
  const grid = useRef<HTMLTableElement>(null);
  const focusNext = useRef<string | null>(null);
  useEffect(() => {
    if (!focusNext.current) return;
    grid.current?.querySelector<HTMLElement>(`[data-day="${focusNext.current}"]`)?.focus();
    focusNext.current = null;
  });

  const onGridKeyDown = (event: TargetedKeyboardEvent<HTMLTableElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    // Count from the day the last key press asked for, if focus has not got there yet.
    const from = focusNext.current ?? (event.target as HTMLElement).dataset.day;
    const to = from && dayForKey(event.key, from);
    if (!to) return;
    event.preventDefault();
    if (calendar.moveTo(to)) focusNext.current = to;
  };

  return (
    <div class="grid gap-x-16 gap-y-14 lg:grid-cols-12">
      <div class="order-2 lg:order-1 lg:col-span-7">
        <div class="flex items-center justify-between gap-3">
          <p id={titleId} class="font-display text-2xl first-letter:uppercase sm:text-3xl" aria-live="polite">
            {monthTitle(locale, month)}
          </p>
          <div class="flex items-center gap-2">
            <button type="button" class="link mr-2 py-1 text-sm" onClick={calendar.goToToday}>
              {strings['calendar.today']}
            </button>
            <button
              type="button"
              class="icon-button"
              onClick={calendar.goBack}
              disabled={!calendar.canGoBack}
              aria-label={strings['calendar.previous']}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              class="icon-button"
              onClick={calendar.goForward}
              disabled={!calendar.canGoForward}
              aria-label={strings['calendar.next']}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <table
          ref={grid}
          role="grid"
          aria-labelledby={titleId}
          class="mt-6 w-full table-fixed border-collapse border-b border-rule"
          onKeyDown={onGridKeyDown}
        >
          {/* Each day's label names its weekday, so the column heads are for the eye only. */}
          <thead aria-hidden="true">
            <tr>
              {weekdayNames(locale).map((name) => (
                <th
                  key={name}
                  scope="col"
                  class="px-1.5 pb-3 text-center text-[0.65rem] font-semibold tracking-[0.16em] text-ink-soft uppercase md:text-left"
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
                  const date =
                    day === today
                      ? `${strings['calendar.today']}, ${longDate(locale, day)}`
                      : longDate(locale, day);
                  return (
                    <td
                      key={day}
                      role="gridcell"
                      aria-selected={day === selected ? true : undefined}
                      class="cal-cell"
                      data-today={day === today ? '' : undefined}
                      data-selected={day === selected ? '' : undefined}
                      data-outside={monthOf(day).month === month.month ? undefined : ''}
                    >
                      {/* The button is stretched over the whole cell by the stylesheet. */}
                      <button
                        type="button"
                        class="cal-day"
                        data-day={day}
                        tabIndex={day === calendar.tabStop ? 0 : -1}
                        aria-label={titles.length ? `${date}: ${titles.join('; ')}` : date}
                        onClick={() => calendar.select(day === selected ? null : day)}
                      >
                        <span class="cal-number">{dayNumber(day)}</span>
                      </button>
                      {/* What follows is for the eye; the button's label reads the events out. */}
                      {dayEvents.slice(0, EVENTS_PER_DAY).map((event, i) => (
                        <span
                          key={event.id}
                          class="cal-event"
                          data-kind={event.kind}
                          style={marker(event, colors)}
                          aria-hidden="true"
                        >
                          {/* In the narrow cell an anniversary shows just the name. */}
                          {event.kind === 'anniversary' ? (event.subject ?? titles[i]) : titles[i]}
                        </span>
                      ))}
                      {dayEvents.length > EVENTS_PER_DAY && (
                        <span class="cal-more" aria-hidden="true">
                          +{dayEvents.length - EVENTS_PER_DAY}
                        </span>
                      )}
                      {dayEvents.length > 0 && (
                        <span class="cal-dots" aria-hidden="true">
                          {dayEvents.slice(0, 3).map((event) => (
                            <i key={event.id} data-kind={event.kind} style={marker(event, colors)} />
                          ))}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div class="order-1 lg:order-2 lg:col-span-5">
        <div class="flex items-baseline justify-between gap-4">
          <h3 class="text-xs font-semibold tracking-[0.22em] text-ink-soft uppercase lg:pt-3">{heading}</h3>
          {selected && (
            <button type="button" class="link py-1 text-sm" onClick={() => calendar.select(null)}>
              {strings['calendar.upcoming']}
            </button>
          )}
        </div>
        {/* Tells a screen reader what picking a day has brought up in the list. */}
        <p class="sr-only" role="status">
          {selected &&
            `${longDate(locale, selected)}: ${listed.length ? formatEventCount(listed.length, locale) : strings['calendar.empty']}`}
        </p>

        {listed.length === 0 ? (
          <p class="mt-5 border-t border-rule py-8 text-ink-soft">
            {strings[selected ? 'calendar.empty' : 'calendar.none']}
          </p>
        ) : (
          <ol class="mt-5">
            {listed.map((event) => {
              const day = selected ?? dateOf(event.start);
              const fraternity = event.fraternityId ? colors[event.fraternityId] : undefined;
              const newTab = <span class="sr-only"> ({strings['a11y.newTab']})</span>;
              return (
                // The row opens to show where the event is and to copy it into one's own calendar.
                <li key={event.id} class="border-t border-rule">
                  <details class="cal-entry group">
                    <summary class="grid cursor-pointer list-none grid-cols-[3.25rem_1fr_auto_auto] items-center gap-4 py-4 sm:gap-5">
                      <time dateTime={event.start} class="text-center">
                        <span class="block font-display text-[2.5rem] leading-none">{dayNumber(day)}</span>
                        <span class="mt-1 block text-[0.66rem] font-semibold tracking-[0.2em] text-ink-soft uppercase">
                          {monthShort(locale, day)}
                        </span>
                      </time>
                      <span class="block">
                        <span class="block font-display text-xl leading-snug">
                          {eventTitle(event, locale, strings)}
                        </span>
                        <span class="mt-0.5 block text-sm text-ink-soft">
                          {[weekdayLong(locale, day), timeRange(event), placeName(event.location)]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                      {fraternity ? (
                        <Shield
                          colors={fraternity.colors}
                          band={fraternity.band}
                          className="h-10 w-auto text-ink/60"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          class={`mr-3 size-2.5 rounded-full ${event.kind === 'meeting' ? 'bg-accent' : 'bg-ink/25'}`}
                        />
                      )}
                      <span
                        aria-hidden="true"
                        class="w-3 text-center text-lg leading-none text-ink-soft transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <div class="pb-5 pl-[4.25rem] text-sm sm:pl-[4.5rem]">
                      {event.description && (
                        // Entries are written in Latvian whatever the language of the page.
                        <p
                          class="mb-3 max-w-[34rem] whitespace-pre-line text-ink-soft"
                          lang={locale === 'lv' ? undefined : 'lv'}
                        >
                          {event.description}
                        </p>
                      )}
                      {event.location && <p class="mb-3">{event.location.replace(/\s*\n\s*/g, ', ')}</p>}
                      <ul class="flex flex-wrap gap-x-6 gap-y-2">
                        {event.location && (
                          <li>
                            <a class="link" href={mapUrl(event.location)} target="_blank" rel="noreferrer">
                              {strings['calendar.map']} <span aria-hidden="true">↗</span>
                              {newTab}
                            </a>
                          </li>
                        )}
                        <li>
                          <a class="link" href={addToGoogleUrl(event)} target="_blank" rel="noreferrer">
                            {strings['calendar.addEvent']} <span aria-hidden="true">↗</span>
                            {newTab}
                          </a>
                        </li>
                      </ul>
                    </div>
                  </details>
                </li>
              );
            })}
          </ol>
        )}

        <a class="link mt-6 inline-block py-1 text-sm" href={subscribeUrl} target="_blank" rel="noreferrer">
          {strings['calendar.subscribe']} <span aria-hidden="true">↗</span>
          <span class="sr-only"> ({strings['a11y.newTab']})</span>
        </a>
      </div>
    </div>
  );
}
