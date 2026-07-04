"use client";

import Link from "next/link";
import { useEffect } from "react";
import CalendarPageFrame from "../_components/CalendarPageFrame";
import { useCalendarStore } from "@/lib/stores/calendar";

function viewButtonClass(active: boolean): string {
  return active
    ? "border border-brand/70 bg-surface-active text-brand-light"
    : "text-text-secondary hover:text-text-near-white";
}

export default function CalendarSettingsPage() {
  const { calendars, sync, load, toggleCalendar } = useCalendarStore();

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <CalendarPageFrame
      activeNav="settings"
      title="Calendar settings"
      subtitle="Configure relays, visibility and reminders."
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
        <section className="rounded-[14px] border border-border bg-[#10151D] p-5">
          <p className="text-[12px] font-semibold text-text-near-white">Sync status</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-[12px] border border-border bg-pill-subtle p-4">
              <p className="text-[11px] text-text-tertiary">Calendars</p>
              <p className="mt-1 text-[20px] font-semibold text-text-near-white">{calendars.length}</p>
            </div>
            <div className="rounded-[12px] border border-border bg-pill-subtle p-4">
              <p className="text-[11px] text-text-tertiary">Healthy relays</p>
              <p className="mt-1 text-[20px] font-semibold text-text-near-white">{sync.healthyRelays}</p>
            </div>
            <div className="rounded-[12px] border border-border bg-pill-subtle p-4">
              <p className="text-[11px] text-text-tertiary">Pending invites</p>
              <p className="mt-1 text-[20px] font-semibold text-text-near-white">{sync.pendingInvitations}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[14px] border border-border bg-[#10151D] p-5">
          <p className="text-[12px] font-semibold text-text-near-white">Calendar visibility</p>
          <div className="mt-3 space-y-2">
            {calendars.map((calendar) => (
              <div key={calendar.id} className="flex items-center justify-between rounded-[12px] border border-border bg-pill-subtle px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: calendar.color }} />
                  <span className="text-[13px] text-text-near-white">{calendar.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleCalendar(calendar.id)}
                  className={`rounded-pill border px-3 py-1 text-[11px] font-medium ${
                    calendar.enabled
                      ? "border-brand/70 bg-surface-active text-brand-light"
                      : "border-border bg-pill-subtle text-text-secondary"
                  }`}
                >
                  {calendar.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </CalendarPageFrame>
  );
}
