"use client";

import Avatar from "@/components/Avatar";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CALENDARS } from "@/lib/mock/calendar";
import { useCalendarStore } from "@/lib/stores/calendar";
import CalendarPageFrame from "../_components/CalendarPageFrame";

export default function CalendarNewEventPage() {
  const router = useRouter();
  const { createEvent, load } = useCalendarStore();
  const [title, setTitle] = useState("Suite planning workshop");
  const [date, setDate] = useState("2026-07-10");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [calendarId, setCalendarId] = useState("work");
  const [guest, setGuest] = useState("Alice Nguyen");
  const [guestQuery, setGuestQuery] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <CalendarPageFrame
      activeNav="month"
      title="New event"
      subtitle="Create a private or shared Nostr calendar event."
      headerActions={
        <div className="rounded-pill border border-border bg-pill-subtle px-4 py-2 text-[12px] text-text-secondary">
          July 2026
        </div>
      }
    >
      <div className="mx-auto mt-5 max-w-[720px] rounded-[18px] border border-border bg-[#151A23] px-6 py-6 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between">
          <h3 className="text-[19px] font-semibold text-text-near-white">New event</h3>
          <button type="button" className="text-[18px] leading-none text-text-tertiary hover:text-text-near-white">
            ×
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <label className="block">
            <span className="text-[11px] text-text-secondary">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 h-12 w-full rounded-[12px] border border-border bg-[#11151D] px-4 text-[14px] text-text-near-white outline-none placeholder:text-text-placeholder"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[11px] text-text-secondary">Date and time</span>
              <input
                value={`${date} · ${startTime}`}
                onChange={() => undefined}
                className="mt-2 h-12 w-full rounded-[12px] border border-border bg-[#11151D] px-4 text-[14px] text-text-near-white outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[11px] text-transparent">End time</span>
              <input
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="mt-2 h-12 w-full rounded-[12px] border border-border bg-[#11151D] px-4 text-[14px] text-text-near-white outline-none"
              />
            </label>
          </div>

          <div>
            <p className="text-[11px] text-text-secondary">Calendar</p>
            <div className="mt-2 flex gap-2">
              {CALENDARS.filter((item) => item.id !== "public").map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCalendarId(item.id)}
                  className={`rounded-pill border px-3 py-1 text-[11px] font-medium ${
                    calendarId === item.id
                      ? "border-brand/70 bg-surface-active text-brand-light"
                      : "border-border bg-pill-subtle text-text-secondary"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-[11px] text-text-secondary">Guests</span>
            <div className="mt-2 flex h-12 items-center gap-3 rounded-[12px] border border-border bg-[#11151D] px-3">
              <Avatar initials="AL" size={34} />
              <span className="text-[13px] text-text-near-white">{guest}</span>
              <input
                value={guestQuery}
                onChange={(event) => setGuestQuery(event.target.value)}
                placeholder="Add people or npubs"
                className="ml-2 flex-1 bg-transparent text-[13px] text-text-secondary outline-none placeholder:text-text-placeholder"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[11px] text-text-secondary">Location or link</span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Add location, call or Nostr room"
              className="mt-2 h-12 w-full rounded-[12px] border border-border bg-[#11151D] px-4 text-[14px] text-text-near-white outline-none placeholder:text-text-placeholder"
            />
          </label>

          <label className="block">
            <span className="text-[11px] text-text-secondary">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add agenda or notes..."
              className="mt-2 min-h-[84px] w-full rounded-[12px] border border-border bg-[#11151D] px-4 py-3 text-[14px] text-text-near-white outline-none placeholder:text-text-placeholder"
            />
          </label>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex gap-2">
              <button
                type="button"
                className="h-8 rounded-pill border border-brand/70 bg-surface-active px-4 text-[12px] font-medium text-brand-light"
              >
                Private
              </button>
              <button
                type="button"
                className="h-8 rounded-pill border border-border bg-pill-subtle px-4 text-[12px] font-medium text-text-secondary"
              >
                Notify guests
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push("/calendar/agenda")}
                className="h-10 rounded-pill border border-border bg-pill-subtle px-6 text-[12px] font-medium text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const [y, m, d] = date.split("-").map(Number);
                  const [startHour, startMinute] = startTime.split(":").map(Number);
                  const [endHour, endMinute] = endTime.split(":").map(Number);
                  const startAt = new Date(y, m - 1, d, startHour, startMinute).getTime();
                  const endAt = new Date(y, m - 1, d, endHour, endMinute).getTime();
                  const created = await createEvent({
                    title,
                    calendarId,
                    startAt,
                    endAt,
                    description,
                    location,
                    guests: [{ id: "alice", initials: "AL", name: guest, accepted: true }],
                    meetingLabel: location || "Nostr room",
                    invitation: "pending",
                    syncStatus: "Published to 3 relays",
                    attachedNote: "Event note",
                  });
                  router.push(`/calendar/events/${created.id}`);
                }}
                className="h-10 rounded-pill bg-brand px-6 text-[12px] font-semibold text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </CalendarPageFrame>
  );
}
