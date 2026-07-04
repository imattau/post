"use client";

import Link from "next/link";
import { useEffect } from "react";
import { monthLabel } from "@/lib/calendar";
import CalendarPageFrame from "../_components/CalendarPageFrame";
import { viewButtonClass } from "../_components/CalendarViewControls";
import { useCalendarStore } from "@/lib/stores/calendar";

export default function CalendarSettingsPage() {
  const { calendars, sync, activeMonth, loading, error, load, toggleCalendar } = useCalendarStore();

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && calendars.length === 0) {
    return (
      <CalendarPageFrame activeNav="settings" title="Loading..." subtitle="">
        <div className="flex h-full items-center justify-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </CalendarPageFrame>
    );
  }

  return (
    <CalendarPageFrame
      activeNav="settings"
      title="Calendar settings"
      subtitle="Configure relays, visibility and reminders."
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
          <p className="text-[12px] font-semibold text-text-near-white">Relay configuration</p>
          <p className="mt-1 text-[11px] text-text-tertiary">Calendar events are published to your configured relays.</p>
          <div className="mt-3 rounded-[12px] border border-border bg-pill-subtle px-4 py-3 text-[12px] text-text-secondary">
            {sync.healthyRelays} healthy relay{sync.healthyRelays !== 1 ? "s" : ""} connected
          </div>
        </section>

        <section className="rounded-[14px] border border-border bg-[#10151D] p-5">
          <p className="text-[12px] font-semibold text-text-near-white">Reminders</p>
          <p className="mt-1 text-[11px] text-text-tertiary">Default reminder for new events.</p>
          <div className="mt-3 rounded-[12px] border border-border bg-pill-subtle px-4 py-3 text-[12px] text-text-secondary">
            15 minutes before
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
