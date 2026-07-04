import type { CalendarEvent } from "@/lib/types";

const DAY_MS = 86_400_000;

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function startOfWeekMonday(date: Date): Date {
  const day = date.getDay() || 7;
  return addDays(date, 1 - day);
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function isSameDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

export function isSameMonth(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

export function buildMonthGrid(month: Date): Date[][] {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const gridStart = startOfWeekMonday(first);
  const gridEnd = addDays(startOfWeekMonday(addDays(last, 6)), 6);
  const weeks: Date[][] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

export function shortMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function weekdayLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

export function formatTimeRange(startAt: number, endAt: number): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${formatter.format(new Date(startAt))} to ${formatter.format(new Date(endAt))}`;
}

export function formatMonthDay(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function getEventSpanDays(event: Pick<CalendarEvent, "startAt" | "endAt">): number {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(1, Math.round((endDay - startDay) / DAY_MS) + 1);
}

export function getWeekEventSpan(
  event: Pick<CalendarEvent, "startAt" | "endAt">,
  weekStart: Date,
  weekEnd: Date,
): { startColumn: number; span: number } | null {
  const eventStart = new Date(event.startAt);
  const eventEnd = new Date(event.endAt);
  const clippedStart = eventStart > weekStart ? eventStart : weekStart;
  const clippedEnd = eventEnd < weekEnd ? eventEnd : weekEnd;
  if (clippedEnd < weekStart || clippedStart > weekEnd) {
    return null;
  }
  const startColumn = Math.max(0, Math.floor((Date.UTC(clippedStart.getFullYear(), clippedStart.getMonth(), clippedStart.getDate()) - Date.UTC(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())) / DAY_MS));
  const span = Math.max(1, Math.floor((Date.UTC(clippedEnd.getFullYear(), clippedEnd.getMonth(), clippedEnd.getDate()) - Date.UTC(clippedStart.getFullYear(), clippedStart.getMonth(), clippedStart.getDate())) / DAY_MS) + 1);
  return { startColumn, span };
}
