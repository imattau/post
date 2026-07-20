"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatLongDate, formatTimeRange } from "@/lib/calendar";
import CalendarPageFrame from "../_components/CalendarPageFrame";
import { useCalendarStore } from "@/lib/stores/calendar";
import CalendarViewControls from "../_components/CalendarViewControls";

function groupKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const PAGE_SIZE = 12;

export default function CalendarAgendaPage() {
  const events = useCalendarStore((s) => s.events);
  const eventCalendarIds = useCalendarStore((s) => s.eventCalendarIds);
  const calendars = useCalendarStore((s) => s.calendars);
  const loading = useCalendarStore((s) => s.loading);
  const error = useCalendarStore((s) => s.error);
  const load = useCalendarStore((s) => s.load);
  const previousMonth = useCalendarStore((s) => s.previousMonth);
  const nextMonth = useCalendarStore((s) => s.nextMonth);
  const goToToday = useCalendarStore((s) => s.goToToday);
  const [showCount, setShowCount] = useState(PAGE_SIZE);

  useEffect(() => {
    void load();
  }, [load]);

  const calendarById = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar])), [calendars]);
  const allUpcoming = useMemo(() => {
    const today = new Date();
    return events
      .filter((event) => new Date(event.endAt) >= today)
      .sort((a, b) => a.startAt - b.startAt);
  }, [events]);
  const upcomingEvents = useMemo(() => allUpcoming.slice(0, showCount), [allUpcoming, showCount]);
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

  if (loading && events.length === 0) {
    return (
      <CalendarPageFrame activeNav="agenda" title="Loading..." subtitle="">
        <div className="flex h-full items-center justify-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </CalendarPageFrame>
    );
  }

  return (
    <CalendarPageFrame
      activeNav="agenda"
      title="Upcoming events"
      subtitle="Chronological view of events and invitations."
      headerActions={<CalendarViewControls activeView="agenda" onToday={goToToday} onPrevious={previousMonth} onNext={nextMonth} />}
    >
      {error && (
        <div className="mb-4 rounded-[12px] border border-danger/30 bg-danger/10 px-4 py-3 text-[12px] text-danger">
          {error}
        </div>
      )}
      <div className="mt-5 space-y-6">
        {groups.map((group) => (
          <section key={groupKey(group.date)}>
            <div className="mb-3 text-[12px] font-medium text-text-secondary">
              {formatLongDate(group.date)}
            </div>
            <div className="space-y-3">
              {group.events.map((event) => {
                const calendar = calendarById.get(eventCalendarIds[event.id] ?? "");
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
                          {event.guests?.[0]?.name ?? ""}
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
        {showCount < allUpcoming.length && (
          <div className="pt-2 text-center">
            <Button variant="outline" size="sm" onClick={() => setShowCount((c) => c + PAGE_SIZE)}>
              Show more
            </Button>
          </div>
        )}
      </div>
    </CalendarPageFrame>
  );
}
