"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatLongDate, formatTimeRange, monthLabel } from "@/lib/calendar";
import CalendarPageFrame from "../_components/CalendarPageFrame";
import { viewButtonClass } from "../_components/CalendarViewControls";
import { useCalendarStore } from "@/lib/stores/calendar";

export default function CalendarInvitationsPage() {
  const events = useCalendarStore((s) => s.events);
  const eventCalendarIds = useCalendarStore((s) => s.eventCalendarIds);
  const calendars = useCalendarStore((s) => s.calendars);
  const activeMonth = useCalendarStore((s) => s.activeMonth);
  const loading = useCalendarStore((s) => s.loading);
  const error = useCalendarStore((s) => s.error);
  const load = useCalendarStore((s) => s.load);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const calendarById = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar])), [calendars]);
  const invitations = useMemo(
    () => events.filter((event) => event.invitation === "pending" || event.invitation === "maybe").sort((a, b) => a.startAt - b.startAt),
    [events]
  );

  if (loading && events.length === 0) {
    return (
      <CalendarPageFrame activeNav="invitations" title="Loading..." subtitle="">
        <div className="flex h-full items-center justify-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </CalendarPageFrame>
    );
  }

  return (
    <CalendarPageFrame
      activeNav="invitations"
      title="Invitations"
      subtitle="Review events waiting for your response."
      headerActions={
        <div className="flex items-center gap-2">
          <div className="rounded-pill border border-border bg-pill-subtle px-4 py-2 text-[12px] text-text-secondary">
            {monthLabel(activeMonth)}
          </div>
          <div className="flex rounded-pill border border-border bg-pill-subtle p-1">
            <Link href="/calendar" className={`h-8 rounded-pill px-4 text-[12px] no-underline inline-flex items-center justify-center font-medium ${viewButtonClass(false)}`}>
              Month
            </Link>
            <Link href="/calendar/week" className={`h-8 rounded-pill px-4 text-[12px] no-underline inline-flex items-center justify-center font-medium ${viewButtonClass(false)}`}>
              Week
            </Link>
            <Link href="/calendar/agenda" className={`h-8 rounded-pill px-4 text-[12px] no-underline inline-flex items-center justify-center font-medium ${viewButtonClass(false)}`}>
              Agenda
            </Link>
          </div>
        </div>
      }
    >
      <div className="mt-5 space-y-3">
        {error && (
          <div className="rounded-[12px] border border-danger/30 bg-danger/10 px-4 py-3 text-[12px] text-danger">
            {error}
          </div>
        )}
        {feedback && (
          <div className="rounded-[14px] border border-ok/30 bg-ok/10 p-3 text-[12px] text-ok">
            {feedback}
          </div>
        )}
        {invitations.length === 0 && (
          <div className="rounded-[14px] border border-border bg-pill-subtle p-6 text-[12px] text-text-secondary">
            No pending invitations.
          </div>
        )}
        {invitations.map((event) => {
          const calendar = calendarById.get(eventCalendarIds[event.id] ?? "");
          return (
            <div key={event.id} className="rounded-[14px] border border-border bg-[#10151D] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[16px] font-medium text-text-near-white">{event.title}</p>
                  <p className="mt-1 text-[12px] text-text-secondary">
                    {formatLongDate(new Date(event.startAt))} · {formatTimeRange(event.startAt, event.endAt)}
                  </p>
                  <p className="mt-2 text-[11px] text-text-tertiary">{calendar?.name ?? "Calendar"}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await updateEvent(event.id, { invitation: "accepted" });
                      setFeedback("Accepted");
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-warn"
                    onClick={async () => {
                      await updateEvent(event.id, { invitation: "maybe" });
                      setFeedback("Marked as maybe");
                    }}
                  >
                    Maybe
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      await updateEvent(event.id, { invitation: "declined" });
                      setFeedback("Declined");
                    }}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CalendarPageFrame>
  );
}
