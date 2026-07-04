"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { formatLongDate, formatTimeRange } from "@/lib/calendar";
import CalendarPageFrame from "../_components/CalendarPageFrame";
import { useCalendarStore } from "@/lib/stores/calendar";

function viewButtonClass(active: boolean): string {
  return active
    ? "border border-brand/70 bg-surface-active text-brand-light"
    : "text-text-secondary hover:text-text-near-white";
}

export default function CalendarInvitationsPage() {
  const { events, calendars, load, updateEvent } = useCalendarStore();

  useEffect(() => {
    void load();
  }, [load]);

  const calendarById = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar])), [calendars]);
  const invitations = useMemo(
    () => events.filter((event) => event.invitation === "pending" || event.invitation === "maybe").sort((a, b) => a.startAt - b.startAt),
    [events]
  );

  return (
    <CalendarPageFrame
      activeNav="invitations"
      title="Invitations"
      subtitle="Review events waiting for your response."
      headerActions={
        <div className="flex items-center gap-2">
          <div className="rounded-pill border border-border bg-pill-subtle px-4 py-2 text-[12px] text-text-secondary">
            July 2026
          </div>
          <div className="flex rounded-pill border border-border bg-pill-subtle p-1">
            <Link href="/calendar" className={`h-8 rounded-pill px-4 text-[12px] no-underline ${viewButtonClass(false)}`}>
              Month
            </Link>
            <Link href="/calendar/week" className={`h-8 rounded-pill px-4 text-[12px] no-underline ${viewButtonClass(false)}`}>
              Week
            </Link>
            <Link href="/calendar/agenda" className={`h-8 rounded-pill px-4 text-[12px] no-underline ${viewButtonClass(false)}`}>
              Agenda
            </Link>
          </div>
        </div>
      }
    >
      <div className="mt-5 space-y-3">
        {invitations.length === 0 && (
          <div className="rounded-[14px] border border-border bg-pill-subtle p-6 text-[12px] text-text-secondary">
            No pending invitations.
          </div>
        )}
        {invitations.map((event) => {
          const calendar = calendarById.get(event.calendarId);
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
                  <button
                    type="button"
                    onClick={async () => updateEvent(event.id, { invitation: "accepted" })}
                    className="h-8 rounded-pill border border-brand/70 bg-surface-active px-4 text-[12px] font-medium text-brand-light"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={async () => updateEvent(event.id, { invitation: "maybe" })}
                    className="h-8 rounded-pill border border-border bg-pill-subtle px-4 text-[12px] font-medium text-warn"
                  >
                    Maybe
                  </button>
                  <button
                    type="button"
                    onClick={async () => updateEvent(event.id, { invitation: "declined" })}
                    className="h-8 rounded-pill border border-border bg-pill-subtle px-4 text-[12px] font-medium text-danger"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CalendarPageFrame>
  );
}
