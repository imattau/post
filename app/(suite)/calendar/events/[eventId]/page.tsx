"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { monthLabel } from "@/lib/calendar";
import { useCalendarStore } from "@/lib/stores/calendar";
import CalendarPageFrame from "../../_components/CalendarPageFrame";
import EventDetailsPanel from "../../_components/EventDetailsPanel";

export default function CalendarEventDetailsPage() {
  const params = useParams<{ eventId: string }>();
  const { events, calendars, activeMonth, load, selectEvent, updateEvent } = useCalendarStore();

  useEffect(() => {
    void load();
  }, [load]);

  const calendarById = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar])), [calendars]);
  const event = useMemo(
    () => events.find((item) => item.id === params.eventId) ?? null,
    [events, params.eventId]
  );
  const calendar = event ? calendarById.get(event.calendarId) : null;

  useEffect(() => {
    if (event) selectEvent(event.id);
  }, [event, selectEvent]);

  return (
    <CalendarPageFrame
      activeNav="agenda"
      title="Event details"
      subtitle="Review, respond to and manage a calendar event."
      headerActions={
        <div className="flex items-center gap-2">
          <div className="rounded-pill border border-border bg-pill-subtle px-4 py-2 text-[12px] text-text-secondary">
            {monthLabel(activeMonth)}
          </div>
          <Button variant="outline" size="icon" aria-label="More actions">
            ⋮
          </Button>
        </div>
      }
      rightRail={
        event && calendar ? (
          <EventDetailsPanel
            event={event}
            calendar={calendar}
            onAccept={() => updateEvent(event.id, { invitation: "accepted" })}
            onMaybe={() => updateEvent(event.id, { invitation: "maybe" })}
            onDecline={() => updateEvent(event.id, { invitation: "declined" })}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[12px] text-text-secondary">
            Event not found.
          </div>
        )
      }
    >
      <div className="min-h-[640px]" />
    </CalendarPageFrame>
  );
}
