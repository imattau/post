"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import Avatar from "@/components/Avatar";
import { buildMonthGrid, formatLongDate, formatTimeRange, getEventSpanDays, isSameDay, isSameMonth, monthLabel } from "@/lib/calendar";
import { useCalendarStore } from "@/lib/stores/calendar";
import CalendarViewControls from "./CalendarViewControls";

function badgeTone(color: string): string {
  if (color === "var(--color-brand)") return "bg-brand/12 text-brand-light border-brand/40";
  if (color === "var(--color-info)") return "bg-info/12 text-info border-info/40";
  if (color === "var(--color-ok)") return "bg-ok/12 text-ok border-ok/40";
  if (color === "var(--color-warn)") return "bg-warn/12 text-warn border-warn/40";
  return "bg-danger/12 text-danger border-danger/40";
}

function eventCardTone(color: string): string {
  if (color === "var(--color-brand)") return "bg-[#4A2F82] border-l-brand";
  if (color === "var(--color-info)") return "bg-[#1E3E6A] border-l-info";
  if (color === "var(--color-ok)") return "bg-[#194A3A] border-l-ok";
  if (color === "var(--color-warn)") return "bg-[#5A4520] border-l-warn";
  return "bg-[#5A2434] border-l-danger";
}

function formatRelativeTime(updatedAt: number): string {
  const seconds = Math.max(1, Math.floor((Date.now() - updatedAt) / 1000));
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ago`;
}

function CalendarEventPill({
  title,
  subtitle,
  color,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  color: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex min-h-[40px] flex-col justify-center gap-0.5 rounded-[8px] border border-white/5 border-l-[3px] px-2.5 py-1 text-left shadow-[0_10px_18px_rgba(0,0,0,0.12)] ${eventCardTone(color)} ${
        compact ? "text-[11px]" : "text-[12px]"
      }`}
    >
      <span className="font-medium leading-tight text-white">{title}</span>
      {subtitle && <span className="text-[10px] leading-tight text-white/70">{subtitle}</span>}
    </div>
  );
}

function CalendarMiniGrid({
  activeMonth,
  selectedDate,
  onPickMonth,
  onPickDate,
}: {
  activeMonth: Date;
  selectedDate: Date;
  onPickMonth: (month: Date) => void;
  onPickDate: (date: Date) => void;
}) {
  const weeks = useMemo(() => buildMonthGrid(activeMonth), [activeMonth]);

  return (
    <div className="rounded-[10px]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[13px] font-semibold text-text-near-white">{monthLabel(activeMonth)}</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onPickMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1))}
            className="flex h-5 w-5 items-center justify-center rounded-[6px] border border-border text-[12px] text-text-secondary transition-colors hover:bg-surface-active hover:text-text-near-white"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => onPickMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1))}
            className="flex h-5 w-5 items-center justify-center rounded-[6px] border border-border text-[12px] text-text-secondary transition-colors hover:bg-surface-active hover:text-text-near-white"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] text-text-tertiary">
        {["M", "T", "W", "T", "F", "S", "S"].map((day) => (
          <span key={day}>{day}</span>
        ))}
        {weeks.flat().map((day) => {
          const selected = isSameDay(day, selectedDate);
          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => onPickDate(day)}
              className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] transition-colors ${
                selected ? "bg-brand text-white" : "text-text-secondary hover:bg-surface-active hover:text-text-near-white"
              } ${isSameMonth(day, activeMonth) ? "" : "opacity-40"}`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GuestsRow({ guests }: { guests: { id: string; initials: string; name: string; accepted: boolean }[] }) {
  return (
    <div className="flex items-center">
      {guests.slice(0, 3).map((guest, index) => (
        <div
          key={guest.id}
          className={`-ml-1 ${index === 0 ? "ml-0" : ""} rounded-full ring-2 ring-[#151922]`}
          title={guest.name}
        >
          <Avatar initials={guest.initials} size={26} />
        </div>
      ))}
      {guests.length > 3 && (
        <div className="-ml-1 flex h-[26px] w-[26px] items-center justify-center rounded-full border border-border bg-pill-subtle text-[10px] font-medium text-text-secondary ring-2 ring-[#151922]">
          +{guests.length - 3}
        </div>
      )}
    </div>
  );
}

export default function CalendarWorkspace() {
  const {
    calendars,
    events,
    sync,
    activeMonth,
    selectedDate,
    selectedEventId,
    viewMode,
    load,
    selectDate,
    selectEvent,
    setMonth,
    goToToday,
    previousMonth,
    nextMonth,
    toggleCalendar,
  } = useCalendarStore();

  useEffect(() => {
    void load();
  }, [load]);

  const calendarById = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar])), [calendars]);
  const visibleEvents = useMemo(
    () => events.filter((event) => calendarById.get(event.calendarId)?.enabled !== false).sort((a, b) => a.startAt - b.startAt),
    [events, calendarById]
  );
  const weeks = useMemo(() => buildMonthGrid(activeMonth), [activeMonth]);
  const selectedEvent = useMemo(
    () => visibleEvents.find((event) => event.id === selectedEventId) ?? visibleEvents[0] ?? null,
    [selectedEventId, visibleEvents]
  );

  const selectedEventCalendar = selectedEvent ? calendarById.get(selectedEvent.calendarId) : null;
  const today = new Date();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-canvas text-text-primary">
      <div className="grid min-h-0 flex-1 grid-cols-[248px_minmax(0,1fr)_352px] divide-x divide-border">
        <aside className="flex min-h-0 flex-col overflow-y-auto bg-sidebar px-6 pb-5 pt-[24px]">
          <div>
            <h1 className="text-[22px] font-semibold text-text-near-white">Calendar</h1>
            <p className="mt-1 text-[11px] text-text-secondary">Events across your Nostr identity</p>
          </div>

          <Link
            href="/calendar/new"
            className="mt-5 flex h-10 items-center gap-3 rounded-pill bg-brand px-4 text-left text-white transition-[filter] duration-150 hover:brightness-110 no-underline"
          >
            <span className="text-[18px] leading-none">＋</span>
            <span className="text-[14px] font-semibold">New event</span>
          </Link>

          <div className="mt-5">
            <CalendarMiniGrid
              activeMonth={activeMonth}
              selectedDate={selectedDate}
              onPickMonth={setMonth}
              onPickDate={selectDate}
            />
          </div>

          <section className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">My calendars</p>
            <div className="mt-2 space-y-1">
              {calendars.map((calendar) => (
                <button
                  key={calendar.id}
                  type="button"
                  onClick={() => void toggleCalendar(calendar.id)}
                  className={`flex h-9 w-full items-center justify-between rounded-[10px] px-2.5 transition-colors ${
                    calendar.enabled ? "bg-transparent hover:bg-pill-subtle" : "bg-transparent opacity-55"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: calendar.color }} />
                    <span className="text-[12px] font-medium text-text-near-white">{calendar.name}</span>
                  </div>
                  <span className="text-[11px] text-ok">✓</span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">Shared</p>
            <div className="mt-3 space-y-2">
              {[
                { initials: "AL", name: "Alice Nguyen" },
                { initials: "JB", name: "Jonas Berg" },
              ].map((person) => (
                <div key={person.name} className="flex items-center gap-3">
                  <Avatar initials={person.initials} size={28} />
                  <span className="text-[12px] font-medium text-text-secondary">{person.name}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-auto pt-6">
            <div className="rounded-[16px] border border-border bg-[#11151D] p-4 shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-text-near-white">Calendar sync</p>
                <span className="text-[10px] text-text-tertiary">{formatRelativeTime(sync.updatedAt)}</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[12px] text-text-secondary">
                <span className="h-2 w-2 rounded-full bg-ok" />
                <span>{sync.syncedCalendars} calendars synced</span>
              </div>
              <div className="mt-3 space-y-1 text-[11px] text-text-secondary">
                <div className="flex items-center justify-between">
                  <span>Invitations</span>
                  <span className="font-medium text-warn">{sync.pendingInvitations} pending</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Relays</span>
                  <span className="font-medium text-text-near-white">{sync.healthyRelays} healthy</span>
                </div>
              </div>
            </div>
          </section>
        </aside>

        <main className="flex min-h-0 flex-col overflow-y-auto bg-canvas px-5 pb-5 pt-[24px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-text-near-white">{monthLabel(activeMonth)}</h2>
              <p className="mt-1 text-[11px] text-text-tertiary">Month view for your published and shared events</p>
            </div>
            <CalendarViewControls activeView={viewMode} onToday={goToToday} onPrevious={previousMonth} onNext={nextMonth} />
          </div>

          <div className="mt-5 overflow-hidden rounded-[16px] border border-border shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
            <div className="grid grid-cols-7 border-b border-border bg-[#121721] text-[11px] text-text-tertiary">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="px-3 py-2 text-left">
                  {day}
                </div>
              ))}
            </div>

            <div className="divide-y divide-border">
              {weeks.map((week) => {
                const weekStart = week[0];
                return (
                  <div key={weekStart.toISOString()} className="grid grid-cols-7 overflow-visible">
                    {week.map((day, index) => {
                      const dayEvents = visibleEvents.filter((event) => isSameDay(new Date(event.startAt), day));
                      const selected = isSameDay(day, selectedDate);
                      const dayInMonth = isSameMonth(day, activeMonth);
                      const hasToday = isSameDay(day, today);
                      return (
                        <div
                          key={day.toISOString()}
                          onClick={() => selectDate(day)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              selectDate(day);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className={`group relative min-h-[156px] border-r border-border p-2 text-left last:border-r-0 ${
                            dayInMonth ? "bg-canvas" : "bg-[#0C1016]"
                          } ${hasToday || selected ? "z-10" : ""}`}
                        >
                          <div className="flex items-start justify-between">
                            <span
                              className={`flex h-6 min-w-6 items-center justify-center rounded-full text-[11px] ${
                                selected
                                  ? "bg-brand text-white"
                                  : hasToday
                                    ? "bg-surface-active text-brand-light"
                                    : dayInMonth
                                      ? "text-text-secondary group-hover:text-text-near-white"
                                      : "text-text-tertiary/70"
                              }`}
                            >
                              {day.getDate()}
                            </span>
                            {dayEvents.length > 0 && (
                              <span className="mt-1 text-[9px] uppercase tracking-[0.08em] text-text-tertiary">
                                {dayEvents.length}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 space-y-1.5 overflow-visible">
                            {visibleEvents
                              .filter((event) => isSameDay(new Date(event.startAt), day))
                              .map((event) => {
                                const calendar = calendarById.get(event.calendarId);
                                const spanDays = event.allDay ? getEventSpanDays(event) : 1;
                                const isMultiDay = spanDays > 1;
                                const subtitle = event.allDay
                                  ? "All day"
                                  : formatTimeRange(event.startAt, event.endAt).replace(" to ", " - ");
                                return (
                                  <button
                                    key={event.id}
                                    type="button"
                                    className={`block text-left ${isMultiDay ? "absolute left-2 right-auto top-[32px] z-20" : "relative"}`}
                                    style={
                                      isMultiDay
                                        ? {
                                            width: `calc(${spanDays} * 100% + ${(spanDays - 1) * 1}px)`,
                                          }
                                        : undefined
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectEvent(event.id);
                                    }}
                                  >
                                    <CalendarEventPill
                                      title={event.title}
                                      subtitle={subtitle}
                                      color={calendar?.color ?? "var(--color-brand)"}
                                      compact={isMultiDay}
                                    />
                                  </button>
                                );
                              })}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <aside className="flex min-h-0 flex-col overflow-y-auto bg-canvas px-5 pb-5 pt-[24px]">
          <div className="flex items-start justify-between">
            <h2 className="text-[18px] font-semibold text-text-near-white">Event details</h2>
            <button
              type="button"
              className="text-[18px] leading-none text-text-tertiary transition-colors hover:text-text-near-white"
              aria-label="Close details"
            >
              ×
            </button>
          </div>

          {selectedEvent && selectedEventCalendar ? (
            <div className="mt-5 space-y-5">
              <section className="rounded-[14px] border border-brand/70 bg-[#221832] px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                <h3 className="text-[17px] font-semibold text-text-near-white">{selectedEvent.title}</h3>
                <p className="mt-1 text-[12px] text-text-secondary">
                  {formatLongDate(new Date(selectedEvent.startAt))} · {formatTimeRange(selectedEvent.startAt, selectedEvent.endAt)}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`rounded-pill border px-3 py-1 text-[11px] font-medium ${badgeTone(selectedEventCalendar.color)}`}>
                    {selectedEventCalendar.name}
                  </span>
                  {selectedEvent.invitation && (
                    <span className="rounded-pill border border-border bg-pill-subtle px-3 py-1 text-[11px] font-medium text-text-secondary">
                      {selectedEvent.invitation === "accepted"
                        ? "Accepted"
                        : selectedEvent.invitation === "pending"
                          ? "Pending"
                          : selectedEvent.invitation === "maybe"
                            ? "Maybe"
                            : "Declined"}
                    </span>
                  )}
                </div>
              </section>

              <section>
                <p className="text-[12px] font-semibold text-text-near-white">Video meeting</p>
                <p className="mt-1 text-[11px] text-text-secondary">{selectedEvent.meetingLabel ?? "Meeting details unavailable"}</p>
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
                <div className="mt-3 flex items-center justify-between gap-3">
                  {selectedEvent.guests ? <GuestsRow guests={selectedEvent.guests} /> : <span className="text-[12px] text-text-secondary">No guests</span>}
                  {selectedEvent.guests && (
                    <p className="text-right text-[11px] text-text-tertiary">
                      {selectedEvent.guests.length} invited · {selectedEvent.guests.filter((guest) => guest.accepted).length} accepted
                    </p>
                  )}
                </div>
              </section>

              <div className="h-px bg-border" />

              <section>
                <p className="text-[12px] font-semibold text-text-near-white">Invitation</p>
                <div className="mt-3 flex gap-2">
                  {["Accept", "Maybe", "Decline"].map((action, index) => (
                    <button
                      key={action}
                      type="button"
                      className={`h-8 rounded-pill border px-4 text-[12px] font-medium transition-colors ${
                        index === 0
                          ? "border-brand/70 bg-surface-active text-brand-light"
                          : index === 1
                            ? "border-border bg-pill-subtle text-warn"
                            : "border-border bg-pill-subtle text-danger"
                      }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </section>

              <div className="h-px bg-border" />

              <section>
                <p className="text-[12px] font-semibold text-text-near-white">Description</p>
                <p className="mt-2 text-[12px] leading-6 text-text-secondary">
                  {selectedEvent.description ?? "No description added."}
                </p>
              </section>

              <div className="h-px bg-border" />

              <section>
                <p className="text-[12px] font-semibold text-text-near-white">Nostr delivery</p>
                <div className="mt-2 flex items-center gap-2 text-[12px] text-text-secondary">
                  <span className="h-2 w-2 rounded-full bg-ok" />
                  <span>{selectedEvent.syncStatus ?? "Published to 4 relays"}</span>
                </div>
                <p className="mt-3 text-[11px] text-text-tertiary">Signed by Alice Nguyen</p>
                <p className="mt-1 text-[11px] text-text-tertiary">Event ID nostr:event1…</p>
              </section>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="h-10 rounded-pill border border-border bg-pill-subtle text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-active hover:text-text-near-white"
                >
                  Edit event
                </button>
                <button
                  type="button"
                  className="h-10 rounded-pill border border-border bg-pill-subtle text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-active hover:text-text-near-white"
                >
                  Message guests
                </button>
              </div>

              <section className="rounded-[12px] border border-border bg-[#11151D] px-4 py-3">
                <p className="text-[11px] text-text-tertiary">Attached note</p>
                <p className="mt-1 text-[12px] font-medium text-brand-light">
                  {selectedEvent.attachedNote ?? selectedEvent.noteTitle ?? "Event note"}
                </p>
              </section>
            </div>
          ) : (
            <div className="mt-8 rounded-[14px] border border-border bg-pill-subtle p-4 text-[12px] text-text-secondary">
              Select an event to inspect guests, delivery status, and meeting details.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
