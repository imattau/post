"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { formatLongDate, formatTimeRange } from "@/lib/calendar";
import CalendarPageFrame from "../_components/CalendarPageFrame";
import { useCalendarStore } from "@/lib/stores/calendar";
import CalendarViewControls from "../_components/CalendarViewControls";

function groupKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function CalendarAgendaPage() {
  const { activeMonth, events, calendars, load, previousMonth, nextMonth, goToToday } = useCalendarStore();

  useEffect(() => {
    void load();
  }, [load]);

  const calendarById = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar])), [calendars]);
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    return events
      .filter((event) => new Date(event.endAt) >= today)
      .sort((a, b) => a.startAt - b.startAt)
      .slice(0, 12);
  }, [events]);
  const groups = useMemo(() => {
    const map = new Map<string, typeof upcomingEvents>();
    for (const event of upcomingEvents) {
      const key = groupKey(new Date(event.startAt));
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return [...map.entries()].map(([key, value]) => ({ date: new Date(`${key}T00:00:00`), events: value }));
  }, [upcomingEvents]);

  return (
    <CalendarPageFrame
      activeNav="agenda"
      title="Upcoming events"
      subtitle="Chronological view of events and invitations."
      headerActions={<CalendarViewControls activeView="agenda" onToday={goToToday} onPrevious={previousMonth} onNext={nextMonth} />}
    >
      <div className="mt-5 space-y-6">
        {groups.map((group) => (
          <section key={groupKey(group.date)}>
            <div className="mb-3 text-[12px] font-medium text-text-secondary">
              {formatLongDate(group.date)}
            </div>
            <div className="space-y-3">
              {group.events.map((event) => {
                const calendar = calendarById.get(event.calendarId);
                return (
                  <Link
                    key={event.id}
                    href={`/calendar/events/${event.id}`}
                    className="flex min-h-[94px] items-stretch overflow-hidden rounded-[14px] border border-border bg-[#10151D] no-underline shadow-[0_10px_20px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#121924]"
                  >
                    <div className="w-2 shrink-0" style={{ backgroundColor: calendar?.color ?? "var(--color-brand)" }} />
                    <div className="flex flex-1 items-center px-6 py-5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[17px] font-medium text-text-near-white">{event.title}</p>
                        <p className="mt-1 text-[12px] text-text-secondary">
                          {formatTimeRange(event.startAt, event.endAt)}
                        </p>
                      </div>
                      <div className="max-w-[240px] text-right">
                        <p className="text-[12px] text-text-secondary">
                          {event.guests?.[0]?.name ?? "Alice Nguyen"}
                        </p>
                        <p className="mt-1 text-[12px] text-text-tertiary">
                          {calendar?.name ?? "Calendar"}
                        </p>
                      </div>
                      <span className="ml-6 text-[18px] text-text-secondary">›</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
        {groups.length === 0 && (
          <div className="rounded-[14px] border border-border bg-pill-subtle p-6 text-[12px] text-text-secondary">
            No upcoming events.
          </div>
        )}
      </div>
    </CalendarPageFrame>
  );
}
