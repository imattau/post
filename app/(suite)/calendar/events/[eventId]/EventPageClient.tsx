"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatLongDate, formatTimeRange, monthLabel } from "@/lib/calendar";
import { useCalendarStore } from "@/lib/stores/calendar";
import CalendarPageFrame from "../../_components/CalendarPageFrame";
import EventDetailsPanel from "../../_components/EventDetailsPanel";
import GuestsRow from "../../_components/GuestsRow";

export default function EventPageClient() {
  const params = useParams<{ eventId: string }>();
  const events = useCalendarStore((s) => s.events);
  const calendars = useCalendarStore((s) => s.calendars);
  const activeMonth = useCalendarStore((s) => s.activeMonth);
  const load = useCalendarStore((s) => s.load);
  const selectEvent = useCalendarStore((s) => s.selectEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);

  useEffect(() => {
    void load();
  }, [load]);

  const calendarById = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar])), [calendars]);
  const event = useMemo(
    () => events.find((item) => item.id === params.eventId) ?? null,
    [events, params.eventId]
  );
  const calendar = event ? (calendarById.get(event.calendarId) ?? null) : null;

  useEffect(() => {
    if (event) selectEvent(event.id);
  }, [event, selectEvent]);

  if (!event) {
    return (
      <CalendarPageFrame activeNav="agenda" title="Event details" subtitle="Review, respond to and manage a calendar event.">
        <div className="flex h-full items-center justify-center text-[12px] text-text-secondary">Event not found.</div>
      </CalendarPageFrame>
    );
  }

  return (
    <CalendarPageFrame
      activeNav={undefined}
      title={event.title}
      subtitle={formatLongDate(new Date(event.startAt))}
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
        <EventDetailsPanel
          event={event}
          calendar={calendar}
          onClose={() => selectEvent(null)}
          onAccept={() => updateEvent(event.id, { invitation: "accepted" })}
          onMaybe={() => updateEvent(event.id, { invitation: "maybe" })}
          onDecline={() => updateEvent(event.id, { invitation: "declined" })}
          onDelete={() => deleteEvent(event.id)}
        />
      }
    >
      <div className="mt-5 space-y-5">
        <Card>
          <CardContent className="px-5 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[17px] font-semibold text-text-near-white">{event.title}</h3>
                <p className="mt-1 text-[13px] text-text-secondary">
                  {formatLongDate(new Date(event.startAt))} · {formatTimeRange(event.startAt, event.endAt)}
                </p>
              </div>
              <div className="flex gap-2">
                {calendar && <Badge variant="info">{calendar.name}</Badge>}
                {event.invitation && (
                  <Badge variant="outline">
                    {event.invitation === "accepted" ? "Accepted" : event.invitation === "pending" ? "Pending" : event.invitation === "maybe" ? "Maybe" : "Declined"}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {event.location && (
          <Card>
            <CardContent className="px-5 py-4">
              <p className="text-[11px] text-text-tertiary">Location</p>
              <p className="mt-1 text-[13px] text-text-near-white">{event.location}</p>
            </CardContent>
          </Card>
        )}

        {event.description && (
          <Card>
            <CardContent className="px-5 py-4">
              <p className="text-[11px] text-text-tertiary">Description</p>
              <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{event.description}</p>
            </CardContent>
          </Card>
        )}

        {event.guests && event.guests.length > 0 && (
          <Card>
            <CardContent className="px-5 py-4">
              <p className="text-[11px] text-text-tertiary">Guests</p>
              <div className="mt-2 flex items-center gap-3">
                <GuestsRow guests={event.guests} size={28} />
                <span className="text-[12px] text-text-secondary">
                  {event.guests.length} invited · {event.guests.filter((g) => g.accepted).length} accepted
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {event.meetingLabel && (
          <Card>
            <CardContent className="px-5 py-4">
              <p className="text-[11px] text-text-tertiary">Meeting</p>
              <p className="mt-1 text-[13px] text-text-near-white">{event.meetingLabel}</p>
              <Button size="sm" className="mt-3" onClick={() => toast.info("Meeting link not available")}>Join meeting</Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="px-5 py-4">
            <p className="text-[11px] text-text-tertiary">Nostr delivery</p>
            <div className="mt-2 flex items-center gap-2 text-[12px] text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-ok" />
              <span>{event.syncStatus ?? "Pending publication"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </CalendarPageFrame>
  );
}
