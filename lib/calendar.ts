import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  differenceInCalendarDays,
  format,
} from "date-fns";
import type { CalendarEvent } from "@/lib/types";

export function buildMonthGrid(month: Date): Date[][] {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const gridStart = startOfWeek(first, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(addDays(last, 6), { weekStartsOn: 1 });
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
  return format(date, "MMMM yyyy");
}

export function shortMonthLabel(date: Date): string {
  return format(date, "MMM d");
}

export function weekdayLabel(date: Date): string {
  return format(date, "EEE");
}

export function formatTimeRange(startAt: number, endAt: number): string {
  return `${format(new Date(startAt), "h:mm a")} to ${format(new Date(endAt), "h:mm a")}`;
}

export function formatMonthDay(date: Date): string {
  return format(date, "MMM d");
}

export function formatLongDate(date: Date): string {
  return format(date, "EEEE, MMMM d");
}

export function getEventSpanDays(event: Pick<CalendarEvent, "startAt" | "endAt">): number {
  return Math.max(1, differenceInCalendarDays(event.endAt, event.startAt) + 1);
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
  const startColumn = Math.max(0, differenceInCalendarDays(clippedStart, weekStart));
  const span = Math.max(1, differenceInCalendarDays(clippedEnd, clippedStart) + 1);
  return { startColumn, span };
}

export function startOfWeekMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export { addDays, isSameDay, isSameMonth };
