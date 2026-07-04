"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildMonthGrid, formatTimeRange, getEventSpanDays, isSameDay, isSameMonth, monthLabel } from "@/lib/calendar";
import { useCalendarStore } from "@/lib/stores/calendar";
import CalendarViewControls from "./CalendarViewControls";
import CalendarEventPill from "./CalendarEventPill";
import CalendarMiniGrid from "./CalendarMiniGrid";
import EventDetailsPanel from "./EventDetailsPanel";

function formatRelativeTime(updatedAt: number): string {
  return formatDistanceToNow(updatedAt, { addSuffix: true });
}

export default function CalendarWorkspace() {
  const {
    calendars,
    events,
    sync,
    activeMonth,
    selectedDate,
    selectedEventId,
    viewMode,
    loading,
    load,
    selectDate,
    selectEvent,
    setMonth,
    goToToday,
    previousMonth,
    nextMonth,
    toggleCalendar,
    updateEvent,
  } = useCalendarStore();

  useEffect(() => {
    void load();
  }, [load]);

  const calendarById = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar])), [calendars]);
  const visibleEvents = useMemo(
    () => events.filter((event) => calendarById.get(event.calendarId)?.enabled !== false).sort((a, b) => a.startAt - b.startAt),
    [events, calendarById]
  );
  const weeks = useMemo(() => buildMonthGrid(activeMonth), [activeMonth]);
  const selectedEvent = useMemo(
    () => visibleEvents.find((event) => event.id === selectedEventId) ?? visibleEvents[0] ?? null,
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

          <section className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">Shared</p>
            <div className="mt-3 space-y-2">
              {[
                { initials: "AL", name: "Alice Nguyen" },
                { initials: "JB", name: "Jonas Berg" },
              ].map((person) => (
                <div key={person.name} className="flex items-center gap-3">
                  <Avatar initials={person.initials} size={28} />
                  <span className="text-[12px] font-medium text-text-secondary">{person.name}</span>
                </div>
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
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="px-3 py-2 text-left">
                  {day}
                </div>
              ))}
            </div>

            <div className="divide-y divide-border">
              {weeks.map((week) => {
                const weekStart = week[0];
                return (
                  <div key={weekStart.toISOString()} className="grid grid-cols-7 overflow-visible">
                    {week.map((day) => {
                      const dayEvents = visibleEvents.filter((event) => isSameDay(new Date(event.startAt), day));
                      const selected = isSameDay(day, selectedDate);
                      const dayInMonth = isSameMonth(day, activeMonth);
                      const hasToday = isSameDay(day, today);
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
                            {dayEvents.length > 0 && (
                              <span className="mt-1 text-[9px] uppercase tracking-[0.08em] text-text-tertiary">
                                {dayEvents.length}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 space-y-1.5 overflow-visible">
                            {visibleEvents
                              .filter((event) => isSameDay(new Date(event.startAt), day))
                              .map((event) => {
                                const calendar = calendarById.get(event.calendarId);
                                const spanDays = event.allDay ? getEventSpanDays(event) : 1;
                                const isMultiDay = spanDays > 1;
                                const subtitle = event.allDay
                                  ? "All day"
                                  : formatTimeRange(event.startAt, event.endAt).replace(" to ", " - ");
                                return (
                                  <button
                                    key={event.id}
                                    type="button"
                                    className={`block text-left ${isMultiDay ? "absolute left-2 right-auto top-[32px] z-20" : "relative"}`}
                                    style={
                                      isMultiDay
                                        ? {
                                            width: `calc(${spanDays} * 100% + ${(spanDays - 1) * 1}px)`,
                                          }
                                        : undefined
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectEvent(event.id);
                                    }}
                                  >
                                    <CalendarEventPill
                                      title={event.title}
                                      subtitle={subtitle}
                                      color={calendar?.color ?? "var(--color-brand)"}
                                      compact={isMultiDay}
                                    />
                                  </button>
                                );
                              })}
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
