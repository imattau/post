import { create } from "zustand";
import { CALENDARS, CALENDAR_EVENTS, CALENDAR_MONTH, CALENDAR_SELECTED_DAY, CALENDAR_SYNC } from "@/lib/mock/calendar";
import type { CalendarCalendar, CalendarEvent, CalendarSyncState, CalendarViewMode } from "@/lib/types";

interface CalendarState {
  calendars: CalendarCalendar[];
  events: CalendarEvent[];
  sync: CalendarSyncState;
  activeMonth: Date;
  selectedDate: Date;
  selectedEventId: string | null;
  viewMode: CalendarViewMode;
  loading: boolean;
  load: () => Promise<void>;
  selectDate: (date: Date) => void;
  selectEvent: (eventId: string) => void;
  setViewMode: (mode: CalendarViewMode) => void;
  setMonth: (month: Date) => void;
  goToToday: () => void;
  previousMonth: () => void;
  nextMonth: () => void;
  toggleCalendar: (calendarId: string) => Promise<void>;
  createEvent: (event: Omit<CalendarEvent, "id"> & { id?: string }) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, patch: Partial<CalendarEvent>) => Promise<void>;
  duplicateEvent: (eventId: string) => Promise<CalendarEvent | null>;
}

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  calendars: CALENDARS,
  events: CALENDAR_EVENTS,
  sync: CALENDAR_SYNC,
  activeMonth: CALENDAR_MONTH,
  selectedDate: CALENDAR_SELECTED_DAY,
  selectedEventId: "suite-planning",
  viewMode: "month",
  loading: false,

  async load() {
    set({ loading: true });
    const { db } = await import("@/lib/db/schema");
    const [calendarCount, eventCount] = await Promise.all([
      db.calendarCalendars.count(),
      db.calendarEvents.count(),
    ]);

    if (calendarCount === 0) {
      await db.calendarCalendars.bulkPut(CALENDARS);
    }
    if (eventCount === 0) {
      await db.calendarEvents.bulkPut(CALENDAR_EVENTS);
    }

    const [calendars, events] = await Promise.all([
      db.calendarCalendars.toArray(),
      db.calendarEvents.toArray(),
    ]);
    set({
      calendars,
      events,
      loading: false,
      selectedEventId: get().selectedEventId ?? events[0]?.id ?? null,
    });
  },

  selectDate(date) {
    set({ selectedDate: date });
  },

  selectEvent(eventId) {
    set({ selectedEventId: eventId });
  },

  setViewMode(mode) {
    set({ viewMode: mode });
  },

  setMonth(month) {
    set({ activeMonth: firstOfMonth(month) });
  },

  goToToday() {
    const today = firstOfMonth(new Date());
    set({ activeMonth: today, selectedDate: new Date(), selectedEventId: get().selectedEventId });
  },

  previousMonth() {
    const current = get().activeMonth;
    set({ activeMonth: new Date(current.getFullYear(), current.getMonth() - 1, 1) });
  },

  nextMonth() {
    const current = get().activeMonth;
    set({ activeMonth: new Date(current.getFullYear(), current.getMonth() + 1, 1) });
  },

  async toggleCalendar(calendarId) {
    const calendars = get().calendars.map((calendar) =>
      calendar.id === calendarId ? { ...calendar, enabled: !calendar.enabled } : calendar
    );
    set({ calendars });
    const { db } = await import("@/lib/db/schema");
    const updated = calendars.find((calendar) => calendar.id === calendarId);
    if (updated) {
      await db.calendarCalendars.put(updated);
    }
  },

  async createEvent(event) {
    const created: CalendarEvent = {
      ...event,
      id: event.id ?? crypto.randomUUID(),
    };
    const events = [...get().events, created].sort((a, b) => a.startAt - b.startAt);
    set({ events, selectedEventId: created.id });
    const { db } = await import("@/lib/db/schema");
    await db.calendarEvents.put(created);
    return created;
  },

  async updateEvent(eventId, patch) {
    const events = get().events.map((event) => (event.id === eventId ? { ...event, ...patch } : event));
    set({ events });
    const updated = events.find((event) => event.id === eventId);
    if (!updated) return;
    const { db } = await import("@/lib/db/schema");
    await db.calendarEvents.put(updated);
  },

  async duplicateEvent(eventId) {
    const source = get().events.find((event) => event.id === eventId);
    if (!source) return null;
    const copy = await get().createEvent({
      ...source,
      title: `${source.title} copy`,
      startAt: source.startAt + 3_600_000,
      endAt: source.endAt + 3_600_000,
      guests: source.guests ? source.guests.map((guest) => ({ ...guest })) : undefined,
    });
    return copy;
  },
}));
