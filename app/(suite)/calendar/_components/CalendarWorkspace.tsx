"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildMonthGrid, formatTimeRange, getEventSpanDays, isSameDay, isSameMonth, monthLabel, weekStartFromSetting } from "@/lib/calendar";
import { useCalendarStore } from "@/lib/stores/calendar";
import { useSettingsStore } from "@/lib/stores/settings";
import CalendarViewControls from "./CalendarViewControls";
import CalendarEventPill from "./CalendarEventPill";
import CalendarMiniGrid from "./CalendarMiniGrid";
import EventDetailsPanel from "./EventDetailsPanel";

function formatRelativeTime(updatedAt: number): string {
  return formatDistanceToNow(updatedAt, { addSuffix: true });
}

export default function CalendarWorkspace() {
  const calendars = useCalendarStore((s) => s.calendars);
  const events = useCalendarStore((s) => s.events);
  const sync = useCalendarStore((s) => s.sync);
  const activeMonth = useCalendarStore((s) => s.activeMonth);
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const selectedEventId = useCalendarStore((s) => s.selectedEventId);
  const viewMode = useCalendarStore((s) => s.viewMode);
  const loading = useCalendarStore((s) => s.loading);
  const load = useCalendarStore((s) => s.load);
  const selectDate = useCalendarStore((s) => s.selectDate);
  const selectEvent = useCalendarStore((s) => s.selectEvent);
  const setMonth = useCalendarStore((s) => s.setMonth);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const previousMonth = useCalendarStore((s) => s.previousMonth);
  const nextMonth = useCalendarStore((s) => s.nextMonth);
  const toggleCalendar = useCalendarStore((s) => s.toggleCalendar);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const weekStartSetting = useSettingsStore((s) => s.values["week-start-day"]);
  const showWeekends = (useSettingsStore((s) => s.values["show-weekends"]) ?? true) as boolean;

  useEffect(() => {
    void load();
  }, [load]);

  const calendarById = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar])), [calendars]);
  const visibleEvents = useMemo(
    () => events.filter((event) => calendarById.get(event.calendarId)?.enabled !== false).sort((a, b) => a.startAt - b.startAt),
    [events, calendarById]
  );
  const weekStartsOn = weekStartFromSetting(weekStartSetting);
  const weeks = useMemo(() => buildMonthGrid(activeMonth, weekStartsOn), [activeMonth, weekStartsOn]);
  const selectedEvent = useMemo(
    () => visibleEvents.find((event) => event.id === selectedEventId) ?? null,
    [selectedEventId, visibleEvents]
  );

  const selectedEventCalendar = selectedEvent ? calendarById.get(selectedEvent.calendarId) : null;
  const today = new Date();

  if (loading && events.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-canvas text-text-secondary">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="mt-4 text-[13px]">Loading calendar…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-canvas text-text-primary">
      <div className="grid min-h-0 flex-1 grid-cols-[248px_minmax(0,1fr)_352px] divide-x divide-border">
        <aside className="flex min-h-0 flex-col overflow-y-auto bg-sidebar px-6 pb-5 pt-[24px]">
          <div>
            <h1 className="text-[22px] font-semibold text-text-near-white">Calendar</h1>
            <p className="mt-1 text-[11px] text-text-secondary">Events across your Nostr identity</p>
          </div>

          <Link
            href="/calendar/new"
            className="mt-5 flex h-10 items-center gap-3 rounded-pill bg-brand px-4 text-left text-white transition-[filter] duration-150 hover:brightness-110 no-underline"
          >
            <span className="text-[18px] leading-none">＋</span>
            <span className="text-[14px] font-semibold">New event</span>
          </Link>

          <div className="mt-5">
            <CalendarMiniGrid
              activeMonth={activeMonth}
              selectedDate={selectedDate}
              onPickMonth={setMonth}
              onPickDate={selectDate}
            />
          </div>

          <section className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">My calendars</p>
            <div className="mt-2 space-y-1">
              {calendars.map((calendar) => (
                <button
                  key={calendar.id}
                  type="button"
                  onClick={() => void toggleCalendar(calendar.id)}
                  className={`flex h-9 w-full items-center justify-between rounded-[10px] px-2.5 transition-colors ${
                    calendar.enabled ? "bg-transparent hover:bg-pill-subtle" : "bg-transparent opacity-55"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: calendar.color }} />
                    <span className="text-[12px] font-medium text-text-near-white">{calendar.name}</span>
                  </div>
                  <span className="text-[11px] text-ok">✓</span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-auto pt-6">
            <Card className="shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-text-near-white">Calendar sync</p>
                  <span className="text-[10px] text-text-tertiary">{formatRelativeTime(sync.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                  <span className="h-2 w-2 rounded-full bg-ok" />
                  <span>{sync.syncedCalendars} calendars synced</span>
                </div>
                <div className="space-y-1 text-[11px] text-text-secondary">
                  <div className="flex items-center justify-between">
                    <span>Invitations</span>
                    <span className="font-medium text-warn">{sync.pendingInvitations} pending</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Relays</span>
                    <span className="font-medium text-text-near-white">{sync.healthyRelays} healthy</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </aside>

        <main className="flex min-h-0 flex-col overflow-y-auto bg-canvas px-5 pb-5 pt-[24px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-text-near-white">{monthLabel(activeMonth)}</h2>
              <p className="mt-1 text-[11px] text-text-tertiary">Month view for your published and shared events</p>
            </div>
            <CalendarViewControls activeView={viewMode} onToday={goToToday} onPrevious={previousMonth} onNext={nextMonth} />
          </div>

          <div className="mt-5 overflow-hidden rounded-[16px] border border-border shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
            <div className="grid grid-cols-7 border-b border-border bg-[#121721] text-[11px] text-text-tertiary">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                <div key={day} className={`px-3 py-2 text-left ${!showWeekends && i >= 5 ? "hidden" : ""}`}>
                  {day}
                </div>
              ))}
            </div>

            <div className="divide-y divide-border">
              {weeks.map((week) => {
                const weekStart = week[0];
                const multiDayThisWeek = visibleEvents
                  .filter((event) => event.allDay && getEventSpanDays(event) > 1)
                  .filter((event) => {
                    const start = new Date(event.startAt);
                    const end = new Date(event.endAt);
                    return start <= week[6] && end >= weekStart;
                  });
                return (
                  <div key={weekStart.toISOString()} className="grid grid-cols-7">
                    {week.map((day) => {
                      const selected = isSameDay(day, selectedDate);
                      const dayInMonth = isSameMonth(day, activeMonth);
                      const hasToday = isSameDay(day, today);
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      const startOfDay = new Date(day);
                      startOfDay.setHours(0, 0, 0, 0);
                      const endOfDay = new Date(day);
                      endOfDay.setHours(23, 59, 59, 999);

                      const dayMultiDay = multiDayThisWeek.filter((event) => {
                        const eventStart = new Date(event.startAt);
                        return eventStart <= endOfDay && new Date(event.endAt) >= startOfDay;
                      });
                      const dayRegular = visibleEvents
                        .filter((event) => {
                          if (event.allDay && getEventSpanDays(event) > 1) return false;
                          return isSameDay(new Date(event.startAt), day);
                        })
                        .slice(0, 3);

                      const overflow = visibleEvents.filter((event) => {
                        if (event.allDay && getEventSpanDays(event) > 1) return false;
                        return isSameDay(new Date(event.startAt), day);
                      }).length - 3;

                      return (
                        <div
                          key={day.toISOString()}
                          onClick={() => selectDate(day)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              selectDate(day);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className={`group relative min-h-[156px] border-r border-border p-2 text-left last:border-r-0 ${
                            dayInMonth ? "bg-canvas" : "bg-[#0C1016]"
                          } ${hasToday || selected ? "z-10" : ""}`}
                        >
                          <div className="flex items-start justify-between">
                            <span
                              className={`flex h-6 min-w-6 items-center justify-center rounded-full text-[11px] ${
                                selected
                                  ? "bg-brand text-white"
                                  : hasToday
                                    ? "bg-surface-active text-brand-light"
                                    : dayInMonth
                                      ? "text-text-secondary group-hover:text-text-near-white"
                                      : "text-text-tertiary/70"
                              }`}
                            >
                              {day.getDate()}
                            </span>
                          </div>

                          <div className="mt-1 space-y-0.5">
                            {dayMultiDay.map((event) => {
                              const calendar = calendarById.get(event.calendarId);
                              const eventStart = new Date(event.startAt);
                              const isStart = isSameDay(eventStart, day);
                              return (
                                <button
                                  key={event.id}
                                  type="button"
                                  className="block w-full text-left"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectEvent(event.id);
                                  }}
                                >
                                  <div
                                    className="flex h-5 items-center rounded-[4px] px-1.5 text-[10px] font-medium leading-tight text-white"
                                    style={{
                                      backgroundColor: calendar?.color ? `color-mix(in srgb, ${calendar.color}, transparent 70%)` : "rgba(74,47,130,0.3)",
                                      borderLeft: `2px solid ${calendar?.color ?? "var(--color-brand)"}`,
                                    }}
                                  >
                                    {isStart ? event.title : ""}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className="mt-1 space-y-1">
                            {dayRegular.map((event) => {
                              const calendar = calendarById.get(event.calendarId);
                              const subtitle = event.allDay
                                ? "All day"
                                : formatTimeRange(event.startAt, event.endAt).replace(" to ", " - ");
                              return (
                                <button
                                  key={event.id}
                                  type="button"
                                  className="block w-full text-left"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectEvent(event.id);
                                  }}
                                >
                                  <CalendarEventPill
                                    title={event.title}
                                    subtitle={subtitle}
                                    color={calendar?.color ?? "var(--color-brand)"}
                                  />
                                </button>
                              );
                            })}
                            {overflow > 0 && (
                              <span className="block text-[10px] font-medium text-text-tertiary">
                                +{overflow} more
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <aside className="flex min-h-0 flex-col overflow-y-auto bg-canvas px-5 pb-5 pt-[24px]">
          <div className="flex items-start justify-between">
            <h2 className="text-[18px] font-semibold text-text-near-white">Event details</h2>
            <button
              type="button"
              onClick={() => selectEvent(null)}
              className="text-[18px] leading-none text-text-tertiary transition-colors hover:text-text-near-white"
              aria-label="Close details"
            >
              ×
            </button>
          </div>

          {selectedEvent && selectedEventCalendar ? (
            <div className="mt-5">
              <EventDetailsPanel
                event={selectedEvent}
                calendar={selectedEventCalendar}
                onClose={() => selectEvent(null)}
                onAccept={() => updateEvent(selectedEvent.id, { invitation: "accepted" })}
                onMaybe={() => updateEvent(selectedEvent.id, { invitation: "maybe" })}
                onDecline={() => updateEvent(selectedEvent.id, { invitation: "declined" })}
                onDelete={() => deleteEvent(selectedEvent.id)}
              />
            </div>
          ) : (
            <Card className="mt-8 bg-pill-subtle">
              <CardContent className="p-4 text-[12px] text-text-secondary">
                Select an event to inspect guests, delivery status, and meeting details.
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
