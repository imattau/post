"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useCalendarStore } from "@/lib/stores/calendar";
import { addDays, formatMonthDay, formatTimeRange, isSameDay, monthLabel, startOfWeekMonday } from "@/lib/calendar";
import CalendarPageFrame from "../_components/CalendarPageFrame";
import CalendarViewControls from "../_components/CalendarViewControls";
import CalendarEventPill from "../_components/CalendarEventPill";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarWeekPage() {
  const { activeMonth, selectedDate, events, calendars, loading, error, load, selectDate, selectEvent, previousWeek, nextWeek, goToToday } = useCalendarStore();

  useEffect(() => {
    void load();
  }, [load]);

  const weekStart = useMemo(() => startOfWeekMonday(selectedDate), [selectedDate]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const calendarById = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar])), [calendars]);
  const weekEvents = useMemo(
    () =>
      events
        .filter((event) => {
          const eventDay = new Date(event.startAt);
          return eventDay >= weekStart && eventDay < addDays(weekStart, 7);
        })
        .sort((a, b) => a.startAt - b.startAt),
    [events, weekStart]
  );
  const today = new Date();

  if (loading && events.length === 0) {
    return (
      <CalendarPageFrame activeNav="week" title="Loading..." subtitle="">
        <div className="flex h-full items-center justify-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </CalendarPageFrame>
    );
  }

  return (
    <CalendarPageFrame
      activeNav="week"
      title={monthLabel(activeMonth)}
      subtitle="Seven-day overview of events across your calendars."
      headerActions={<CalendarViewControls activeView="week" onToday={goToToday} onPrevious={previousWeek} onNext={nextWeek} />}
    >
      {error && (
        <div className="mb-4 rounded-[12px] border border-danger/30 bg-danger/10 px-4 py-3 text-[12px] text-danger">
          {error}
        </div>
      )}
      <div className="mt-5 overflow-hidden rounded-[16px] border border-border shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
        <div className="grid grid-cols-7 border-b border-border bg-[#121721] text-[11px] text-text-tertiary">
          {days.map((day) => (
            <div key={day.toISOString()} className="px-3 py-2">
              <div className="font-medium text-text-secondary">{WEEKDAY_LABELS[(day.getDay() + 6) % 7]}</div>
              <div className="mt-1 text-text-near-white">{formatMonthDay(day)}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-border">
          {days.map((day) => {
            const dayEvents = weekEvents.filter((event) => isSameDay(new Date(event.startAt), day));
            const selected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);
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
                className={`min-h-[720px] bg-canvas p-3 ${isToday ? "bg-[#0F1420]" : ""} ${selected ? "ring-1 ring-brand/40" : ""}`}
              >
                <div
                  className={`flex h-8 items-center justify-center rounded-full text-[11px] ${
                    selected ? "bg-brand text-white" : isToday ? "bg-surface-active text-brand-light" : "bg-pill-subtle text-text-secondary"
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="mt-3 space-y-2">
                  {dayEvents.length === 0 && <div className="text-[11px] text-text-tertiary">No events</div>}
                  {dayEvents.map((event) => {
                    const calendar = calendarById.get(event.calendarId);
                    return (
                      <Link
                        key={event.id}
                        href={`/calendar/events/${event.id}`}
                        className="block no-underline"
                        onClick={() => selectEvent(event.id)}
                      >
                        <CalendarEventPill
                          title={event.title}
                          subtitle={formatTimeRange(event.startAt, event.endAt)}
                          color={calendar?.color ?? "var(--color-brand)"}
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CalendarPageFrame>
  );
}
