"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Avatar from "@/components/Avatar";
import { formatLongDate, formatTimeRange } from "@/lib/calendar";
import { useCalendarStore } from "@/lib/stores/calendar";
import CalendarPageFrame from "../../_components/CalendarPageFrame";

function badgeTone(color: string): string {
  if (color === "var(--color-brand)") return "bg-brand/12 text-brand-light border-brand/40";
  if (color === "var(--color-info)") return "bg-info/12 text-info border-info/40";
  if (color === "var(--color-ok)") return "bg-ok/12 text-ok border-ok/40";
  if (color === "var(--color-warn)") return "bg-warn/12 text-warn border-warn/40";
  return "bg-danger/12 text-danger border-danger/40";
}

export default function CalendarEventDetailsPage() {
  const params = useParams<{ eventId: string }>();
  const { events, calendars, load, selectEvent } = useCalendarStore();

  useEffect(() => {
    void load();
  }, [load]);

  const calendarById = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar])), [calendars]);
  const event = useMemo(
    () => events.find((item) => item.id === params.eventId) ?? events.find((item) => item.id === "suite-planning") ?? null,
    [events, params.eventId]
  );
  const calendar = event ? calendarById.get(event.calendarId) : null;
  const guests = event?.guests ?? [];

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
            July 2026
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-pill border border-border bg-pill-subtle text-[16px] text-text-secondary transition-colors hover:bg-surface-active hover:text-text-near-white"
            aria-label="More actions"
          >
            ⋮
          </button>
        </div>
      }
      rightRail={
        event && calendar ? (
          <div className="space-y-5">
            <section className="rounded-[14px] border border-brand/70 bg-[#2b2146] px-5 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <h3 className="text-[17px] font-semibold text-text-near-white">{event.title}</h3>
              <p className="mt-1 text-[12px] text-text-secondary">
                {formatLongDate(new Date(event.startAt))} · {formatTimeRange(event.startAt, event.endAt)}
              </p>
              <div className="mt-3">
                <span className={`rounded-pill border px-3 py-1 text-[11px] font-medium ${badgeTone(calendar.color)}`}>
                  {calendar.name}
                </span>
              </div>
            </section>

            <section>
              <p className="text-[12px] font-semibold text-text-near-white">Video meeting</p>
              <p className="mt-1 text-[11px] text-text-secondary">{event.meetingLabel ?? "Nostr Room · encrypted"}</p>
              <button
                type="button"
                className="mt-3 h-10 w-full rounded-pill bg-brand px-4 text-[13px] font-semibold text-white transition-colors hover:brightness-110"
              >
                Join meeting
              </button>
            </section>

            <div className="h-px bg-border" />

            <section>
              <p className="text-[12px] font-semibold text-text-near-white">Guests</p>
              <div className="mt-3 flex items-center">
                {guests.slice(0, 3).map((guest, index) => (
                  <div key={guest.id} className={`-ml-2 ${index === 0 ? "ml-0" : ""}`}>
                    <Avatar initials={guest.initials} size={30} />
                  </div>
                ))}
                {guests.length > 3 && (
                  <div className="-ml-2 flex h-[30px] w-[30px] items-center justify-center rounded-full border border-border bg-pill-subtle text-[10px] text-text-secondary">
                    +{guests.length - 3}
                  </div>
                )}
              </div>
              <p className="mt-2 text-[11px] text-text-tertiary">
                {guests.length} invited · {guests.filter((guest) => guest.accepted).length} accepted
              </p>
            </section>

            <div className="h-px bg-border" />

            <section>
              <p className="text-[12px] font-semibold text-text-near-white">Invitation</p>
              <div className="mt-3 flex gap-2">
                {[
                  { label: "Accept", className: "border-brand/70 bg-surface-active text-brand-light" },
                  { label: "Maybe", className: "border-border bg-pill-subtle text-warn" },
                  { label: "Decline", className: "border-border bg-pill-subtle text-danger" },
                ].map((item) => (
                  <button key={item.label} type="button" className={`h-8 rounded-pill border px-4 text-[12px] font-medium ${item.className}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            <div className="h-px bg-border" />

            <section>
              <p className="text-[12px] font-semibold text-text-near-white">Description</p>
              <p className="mt-3 text-[12px] leading-6 text-text-secondary">
                {event.description ?? "Review the Post and Drive flows, confirm the shared design system and plan the Calendar implementation."}
              </p>
            </section>

            <div className="h-px bg-border" />

            <section>
              <p className="text-[12px] font-semibold text-text-near-white">Nostr delivery</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-ok" />
                <p className="text-[11px] text-text-secondary">{event.syncStatus ?? "Published to 4 relays"}</p>
              </div>
              <p className="mt-3 text-[10px] text-text-tertiary">Signed by Alice Nguyen</p>
              <p className="mt-1 text-[10px] text-text-tertiary">Event ID nostr:nevent1…</p>
            </section>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button type="button" className="h-10 rounded-[11px] border border-border bg-[#151922] text-[11px] font-medium text-text-secondary">
                Edit event
              </button>
              <button type="button" className="h-10 rounded-[11px] border border-border bg-[#151922] text-[11px] font-medium text-text-secondary">
                Message guests
              </button>
            </div>

            <section className="rounded-[12px] border border-border bg-[#151922] px-4 py-4">
              <p className="text-[10px] text-text-tertiary">Attached note</p>
              <p className="mt-2 text-[11px] text-brand-light">Suite planning agenda.md</p>
            </section>
          </div>
        ) : null
      }
    >
      <div className="min-h-[640px]" />
    </CalendarPageFrame>
  );
}
