"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { monthLabel } from "@/lib/calendar";
import CalendarPageFrame from "../_components/CalendarPageFrame";
import { viewButtonClass } from "../_components/CalendarViewControls";
import { useCalendarStore } from "@/lib/stores/calendar";

export default function CalendarSharedPage() {
  const { calendars, activeMonth, load } = useCalendarStore();

  useEffect(() => {
    void load();
  }, [load]);

  const sharedCalendars = useMemo(() => calendars.filter((calendar) => calendar.id !== "public"), [calendars]);

  return (
    <CalendarPageFrame
      activeNav="shared"
      title="Shared calendars"
      subtitle="Calendars and collaborators visible to other identities."
      headerActions={
        <div className="flex items-center gap-2">
          <div className="rounded-pill border border-border bg-pill-subtle px-4 py-2 text-[12px] text-text-secondary">
            {monthLabel(activeMonth)}
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
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {sharedCalendars.map((calendar) => (
          <div key={calendar.id} className="rounded-[14px] border border-border bg-[#10151D] p-5">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: calendar.color }} />
              <div>
                <p className="text-[15px] font-medium text-text-near-white">{calendar.name}</p>
                <p className="mt-1 text-[11px] text-text-tertiary">
                  {calendar.enabled ? "Visible to collaborators" : "Hidden"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="h-8 rounded-pill border border-border bg-pill-subtle px-4 text-[12px] font-medium text-text-secondary">
                Manage sharing
              </button>
              <button className="h-8 rounded-pill border border-border bg-pill-subtle px-4 text-[12px] font-medium text-text-secondary">
                Copy link
              </button>
            </div>
          </div>
        ))}
      </div>
    </CalendarPageFrame>
  );
}
