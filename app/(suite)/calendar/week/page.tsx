"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useCalendarStore } from "@/lib/stores/calendar";
import CalendarPageFrame from "../_components/CalendarPageFrame";
import { addDays, formatMonthDay, formatTimeRange, isSameDay, monthLabel, startOfWeekMonday } from "@/lib/calendar";
import CalendarViewControls from "../_components/CalendarViewControls";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarWeekPage() {
  const { activeMonth, events, calendars, load, previousMonth, nextMonth, goToToday } = useCalendarStore();

  useEffect(() => {
    void load();
  }, [load]);

  const weekStart = useMemo(() => startOfWeekMonday(activeMonth), [activeMonth]);
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

  return (
    <CalendarPageFrame
      activeNav="week"
      title={monthLabel(activeMonth)}
      subtitle="Seven-day overview of events across your calendars."
      headerActions={<CalendarViewControls activeView="week" onToday={goToToday} onPrevious={previousMonth} onNext={nextMonth} />}
    >
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
            const selected = isSameDay(day, today);
            return (
              <div key={day.toISOString()} className={`min-h-[720px] bg-canvas p-3 ${selected ? "bg-[#0F1420]" : ""}`}>
                <div
                  className={`flex h-8 items-center justify-center rounded-full text-[11px] ${
                    selected ? "bg-brand text-white" : "bg-pill-subtle text-text-secondary"
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
                        className="block rounded-[12px] border border-white/5 border-l-[3px] px-3 py-3 no-underline shadow-[0_10px_18px_rgba(0,0,0,0.12)] transition-transform hover:-translate-y-[1px]"
                        style={{
                          backgroundColor: "rgba(34, 28, 50, 0.9)",
                          borderLeftColor: calendar?.color ?? "var(--color-brand)",
                        }}
                      >
                        <p className="text-[12px] font-medium text-white">{event.title}</p>
                        <p className="mt-1 text-[10px] text-text-secondary">{formatTimeRange(event.startAt, event.endAt)}</p>
                        <p className="mt-2 text-[10px] text-text-tertiary">{calendar?.name ?? "Calendar"}</p>
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
