"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type CalendarView = "month" | "week" | "agenda";

const VIEW_TABS: Array<{ id: CalendarView; label: string; href: string }> = [
  { id: "month", label: "Month", href: "/calendar" },
  { id: "week", label: "Week", href: "/calendar/week" },
  { id: "agenda", label: "Agenda", href: "/calendar/agenda" },
];

export default function CalendarViewControls({
  activeView,
  onToday,
  onPrevious,
  onNext,
  showMore = true,
}: {
  activeView: CalendarView;
  onToday?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  showMore?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {onToday && (
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
      )}

      {(onPrevious || onNext) && (
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={onPrevious} aria-label="Previous period">
            ‹
          </Button>
          <Button variant="outline" size="icon" onClick={onNext} aria-label="Next period">
            ›
          </Button>
        </div>
      )}

      <div className="flex rounded-pill border border-border bg-pill-subtle p-1">
        {VIEW_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`inline-flex h-8 items-center justify-center rounded-pill px-4 text-[12px] font-medium no-underline transition-colors ${
              tab.id === activeView
                ? "border border-brand/70 bg-surface-active text-brand-light"
                : "text-text-secondary hover:text-text-near-white"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {showMore && (
        <Button variant="outline" size="icon" aria-label="More actions">
          ⋮
        </Button>
      )}
    </div>
  );
}
