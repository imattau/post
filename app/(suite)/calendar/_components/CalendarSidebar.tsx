"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCalendarStore } from "@/lib/stores/calendar";

type ActiveNav = "month" | "week" | "agenda" | "invitations" | "shared" | "settings";

const NAV_ITEMS: Array<{
  id: ActiveNav;
  icon: string;
  label: string;
  href: string;
}> = [
  { id: "month", icon: "▦", label: "Month", href: "/calendar" },
  { id: "week", icon: "▤", label: "Week", href: "/calendar/week" },
  { id: "agenda", icon: "☷", label: "Agenda", href: "/calendar/agenda" },
  { id: "invitations", icon: "◎", label: "Invitations", href: "/calendar/invitations" },
  { id: "shared", icon: "⇄", label: "Shared calendars", href: "/calendar/shared" },
  { id: "settings", icon: "⚙", label: "Settings", href: "/calendar/settings" },
];

export default function CalendarSidebar({ activeNav }: { activeNav: ActiveNav }) {
  const calendars = useCalendarStore((s) => s.calendars);
  const visibleCalendars = calendars.filter((calendar) => calendar.id !== "public");

  return (
    <aside className="flex min-h-0 w-[248px] flex-col overflow-y-auto border-r border-border bg-[#11151D] px-6 pb-5 pt-[24px]">
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

      <nav className="mt-5 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = item.id === activeNav;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex h-9 items-center gap-3 rounded-[10px] px-2.5 no-underline transition-colors ${
                active ? "bg-[#2A1F45]" : "hover:bg-pill-subtle"
              }`}
            >
              <span className={`text-[13px] ${active ? "text-brand-light" : "text-text-secondary"}`}>{item.icon}</span>
              <span className={`text-[13px] font-medium ${active ? "text-text-near-white" : "text-text-secondary"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <section className="mt-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">Calendars</p>
        <div className="mt-3 space-y-4">
          {visibleCalendars.map((calendar) => (
            <div key={calendar.id} className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: calendar.color }} />
              <span className="text-[12px] font-medium text-text-secondary">{calendar.name}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex-1" />

      <button type="button" className="relative mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-avatar-6 text-[11px] font-semibold text-white">
        MT
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#11151D] bg-ok" />
      </button>
    </aside>
  );
}
