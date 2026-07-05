import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
  differenceInCalendarDays,
  eachWeekOfInterval,
  eachDayOfInterval,
  format,
} from "date-fns";
import { SHORT_DATE } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";

export function buildMonthGrid(month: Date, weekStartsOn: number = 1): Date[][] {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const gridStart = startOfWeek(first, { weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
  const gridEnd = endOfWeek(addDays(last, 6), { weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
  return eachWeekOfInterval({ start: gridStart, end: gridEnd }, { weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 })
    .map((weekStart) => eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) }));
}

export function monthLabel(date: Date): string {
  return format(date, "MMMM yyyy");
}

export function shortMonthLabel(date: Date): string {
  return format(date, SHORT_DATE);
}

export function weekdayLabel(date: Date): string {
  return format(date, "EEE");
}

export function formatTimeRange(startAt: number, endAt: number): string {
  return `${format(new Date(startAt), "h:mm a")} to ${format(new Date(endAt), "h:mm a")}`;
}

export function formatMonthDay(date: Date): string {
  return format(date, SHORT_DATE);
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

export function weekStartFromSetting(setting: string | undefined): number {
  if (setting === "sunday") return 0;
  if (setting === "saturday") return 6;
  return 1;
}

export { addDays, isSameDay, isSameMonth };
