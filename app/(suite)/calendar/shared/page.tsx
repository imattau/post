"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { monthLabel } from "@/lib/calendar";
import CalendarPageFrame from "../_components/CalendarPageFrame";
import { viewButtonClass } from "../_components/CalendarViewControls";
import { useCalendarStore } from "@/lib/stores/calendar";

export default function CalendarSharedPage() {
  const router = useRouter();
  const calendars = useCalendarStore((s) => s.calendars);
  const activeMonth = useCalendarStore((s) => s.activeMonth);
  const loading = useCalendarStore((s) => s.loading);
  const error = useCalendarStore((s) => s.error);
  const load = useCalendarStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  const sharedCalendars = useMemo(() => calendars.filter((calendar) => calendar.id !== "public"), [calendars]);

  if (loading && calendars.length === 0) {
    return (
      <CalendarPageFrame activeNav="shared" title="Loading..." subtitle="">
        <div className="flex h-full items-center justify-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </CalendarPageFrame>
    );
  }

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
      {error && (
        <div className="mb-4 rounded-[12px] border border-danger/30 bg-danger/10 px-4 py-3 text-[12px] text-danger">
          {error}
        </div>
      )}
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
              <button
                type="button"
                className="h-8 rounded-pill border border-border bg-pill-subtle px-4 text-[12px] font-medium text-text-secondary"
                onClick={() => router.push("/calendar/settings")}
              >
                Manage sharing
              </button>
              <button
                type="button"
                className="h-8 rounded-pill border border-border bg-pill-subtle px-4 text-[12px] font-medium text-text-secondary"
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/calendar?calendar=${calendar.id}`)}
              >
                Copy link
              </button>
            </div>
          </div>
        ))}
      </div>
    </CalendarPageFrame>
  );
}
