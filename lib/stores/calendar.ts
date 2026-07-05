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
  error: string | null;
  load: () => Promise<void>;
  selectDate: (date: Date) => void;
  selectEvent: (eventId: string | null) => void;
  setViewMode: (mode: CalendarViewMode) => void;
  setMonth: (month: Date) => void;
  goToToday: () => void;
  previousMonth: () => void;
  nextMonth: () => void;
  previousWeek: () => void;
  nextWeek: () => void;
  toggleCalendar: (calendarId: string) => Promise<void>;
  createEvent: (event: Omit<CalendarEvent, "id"> & { id?: string }) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, patch: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  duplicateEvent: (eventId: string) => Promise<CalendarEvent | null>;
}

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function recomputeSync(calendars: CalendarCalendar[], events: CalendarEvent[]): CalendarSyncState {
  const syncedCalendars = calendars.filter((c) => c.enabled).length;
  const pendingInvitations = events.filter(
    (e) => e.invitation === "pending" || e.invitation === "maybe"
  ).length;
  return { syncedCalendars, pendingInvitations, healthyRelays: 5, updatedAt: Date.now() };
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  calendars: CALENDARS,
  events: CALENDAR_EVENTS,
  sync: recomputeSync(CALENDARS, CALENDAR_EVENTS),
  activeMonth: CALENDAR_MONTH,
  selectedDate: CALENDAR_SELECTED_DAY,
  selectedEventId: "suite-planning",
  viewMode: "month",
  loading: false,
  error: null,

  async load() {
    set({ loading: true, error: null });
    try {
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
        sync: recomputeSync(calendars, events),
        loading: false,
        selectedEventId: get().selectedEventId ?? events[0]?.id ?? null,
      });
    } catch (err) {
      console.error("Failed to load calendar data:", err);
      set({ loading: false, error: "Failed to load calendar data" });
    }
  },

  selectDate(date) {
    set({ selectedDate: date });
  },

  selectEvent(eventId: string | null) {
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

  previousWeek() {
    const current = get().selectedDate;
    set({ selectedDate: new Date(current.getFullYear(), current.getMonth(), current.getDate() - 7) });
  },

  nextWeek() {
    const current = get().selectedDate;
    set({ selectedDate: new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7) });
  },

  async toggleCalendar(calendarId) {
    set({ error: null });
    try {
      const calendars = get().calendars.map((calendar) =>
        calendar.id === calendarId ? { ...calendar, enabled: !calendar.enabled } : calendar
      );
      const sync = recomputeSync(calendars, get().events);
      set({ calendars, sync });
      const { db } = await import("@/lib/db/schema");
      const updated = calendars.find((calendar) => calendar.id === calendarId);
      if (updated) {
        await db.calendarCalendars.put(updated);
      }
    } catch (err) {
      console.error("Failed to toggle calendar:", err);
      set({ error: "Failed to toggle calendar" });
    }
  },

  async createEvent(event) {
    set({ error: null });
    try {
      const created: CalendarEvent = {
        ...event,
        id: event.id ?? crypto.randomUUID(),
      };
      const events = [...get().events, created].sort((a, b) => a.startAt - b.startAt);
      set({ events, sync: recomputeSync(get().calendars, events), selectedEventId: created.id });
      const { db } = await import("@/lib/db/schema");
      await db.calendarEvents.put(created);
      return created;
    } catch (err) {
      console.error("Failed to create event:", err);
      set({ error: "Failed to create event" });
      throw err;
    }
  },

  async updateEvent(eventId, patch) {
    set({ error: null });
    try {
      const events = get().events.map((event) => (event.id === eventId ? { ...event, ...patch } : event));
      set({ events, sync: recomputeSync(get().calendars, events) });
      const updated = events.find((event) => event.id === eventId);
      if (!updated) return;
      const { db } = await import("@/lib/db/schema");
      await db.calendarEvents.put(updated);
    } catch (err) {
      console.error("Failed to update event:", err);
      set({ error: "Failed to update event" });
    }
  },

  async deleteEvent(eventId) {
    set({ error: null });
    try {
      const events = get().events.filter((event) => event.id !== eventId);
      set({ events, sync: recomputeSync(get().calendars, events), selectedEventId: get().selectedEventId === eventId ? null : get().selectedEventId });
      const { db } = await import("@/lib/db/schema");
      await db.calendarEvents.delete(eventId);
    } catch (err) {
      console.error("Failed to delete event:", err);
      set({ error: "Failed to delete event" });
    }
  },

  async duplicateEvent(eventId) {
    set({ error: null });
    try {
      const source = get().events.find((event) => event.id === eventId);
      if (!source) return null;
      const { id: _originalId, ...sourceData } = source;
      const copy = await get().createEvent({
        ...sourceData,
        title: `${source.title} copy`,
        startAt: source.startAt + 3_600_000,
        endAt: source.endAt + 3_600_000,
        guests: source.guests ? source.guests.map((guest) => ({ ...guest })) : undefined,
      });
      return copy;
    } catch (err) {
      console.error("Failed to duplicate event:", err);
      set({ error: "Failed to duplicate event" });
      return null;
    }
  },
}));
