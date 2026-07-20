import { create } from "zustand";
import { subMonths, addMonths, subWeeks, addWeeks, startOfMonth, addHours } from "date-fns";
import { graph, putNode, putNodes, deleteNode, getNodes, addEdge, EDGE } from "@/lib/db/poly";
import { generateId } from "@/lib/utils";
import type { CalendarCalendar, CalendarEvent, CalendarSyncState, CalendarViewMode } from "@/lib/types";
import { publishCalendarEvent, deleteCalendarEvent as deleteCalendarEventOnRelay, syncCalendarFromRelays } from "@/lib/calendar";
import { useIdentityStore } from "@/lib/stores/identity";
import { useRelaysStore } from "@/lib/stores/relays";

interface CalendarState {
  calendars: CalendarCalendar[];
  events: CalendarEvent[];
  eventCalendarIds: Record<string, string>;
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
  createEvent: (event: Omit<CalendarEvent, "id"> & { id?: string }, calendarId: string) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, patch: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  duplicateEvent: (eventId: string) => Promise<CalendarEvent | null>;
}

function recomputeSync(calendars: CalendarCalendar[], events: CalendarEvent[]): CalendarSyncState {
  const syncedCalendars = calendars.filter((c) => c.enabled).length;
  const pendingInvitations = events.filter(
    (e) => e.invitation === "pending" || e.invitation === "maybe"
  ).length;
  const statuses = useRelaysStore.getState().statuses;
  const healthyRelays = Object.values(statuses).filter((s) => s.connected).length || 5;
  return { syncedCalendars, pendingInvitations, healthyRelays, updatedAt: Date.now() };
}

async function loadEventCalendarIds(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const events = await getNodes<any>('calendar_event');
  for (const ev of events) {
    const targets = graph.getEdgeTargets(ev.id, EDGE.BELONGS_TO);
    if (targets.length > 0) map[ev.id] = targets[0];
  }
  return map;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  calendars: [],
  events: [],
  eventCalendarIds: {},
  sync: { syncedCalendars: 0, pendingInvitations: 0, healthyRelays: 0, updatedAt: Date.now() },
  activeMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  selectedDate: new Date(),
  selectedEventId: null,
  viewMode: "month",
  loading: true,
  error: null,

  async load() {
    set({ loading: true, error: null });
    try {
      const [calendars, events, identity] = await Promise.all([
        getNodes<any>('calendar'),
        getNodes<any>('calendar_event'),
        useIdentityStore.getState().identity
          ? Promise.resolve(useIdentityStore.getState().identity)
          : Promise.resolve(null),
      ]);

      let mergedEvents = events;
      let mergedCalendarIds = await loadEventCalendarIds();

      if (identity?.pubkey) {
        const pool = useRelaysStore.getState().pool;
        if (pool) {
          const existingIds = new Set(events.map((e) => e.id));
          const relayResults = await syncCalendarFromRelays(pool, identity.pubkey, existingIds).catch(() => []);
          if (relayResults.length > 0) {
            const relayEvents = relayResults.map((r) => r.event);
            await putNodes(relayEvents.map((r: any) => ({ type: 'calendar_event', id: r.event.id, data: r.event as any })));
            for (const r of relayResults) {
              await addEdge(r.event.id, EDGE.BELONGS_TO, r.calendarId);
              if (r.event.guests) {
                for (const guest of r.event.guests) {
                  await addEdge(r.event.id, EDGE.HAS_GUEST, guest.id);
                }
              }
              mergedCalendarIds[r.event.id] = r.calendarId;
            }
            mergedEvents = [...events, ...relayEvents].sort((a, b) => a.startAt - b.startAt);
          }
        }
      }

      set({
        calendars,
        events: mergedEvents,
        eventCalendarIds: mergedCalendarIds,
        sync: recomputeSync(calendars, mergedEvents),
        loading: false,
        selectedEventId: get().selectedEventId ?? mergedEvents[0]?.id ?? null,
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
    set({ activeMonth: startOfMonth(month) });
  },

  goToToday() {
    const today = startOfMonth(new Date());
    set({ activeMonth: today, selectedDate: new Date(), selectedEventId: get().selectedEventId });
  },

  previousMonth() {
    set({ activeMonth: startOfMonth(subMonths(get().activeMonth, 1)) });
  },

  nextMonth() {
    set({ activeMonth: startOfMonth(addMonths(get().activeMonth, 1)) });
  },

  previousWeek() {
    set({ selectedDate: subWeeks(get().selectedDate, 1) });
  },

  nextWeek() {
    set({ selectedDate: addWeeks(get().selectedDate, 1) });
  },

  async toggleCalendar(calendarId) {
    set({ error: null });
    try {
      const calendars = get().calendars.map((calendar) =>
        calendar.id === calendarId ? { ...calendar, enabled: !calendar.enabled } : calendar
      );
      const sync = recomputeSync(calendars, get().events);
      set({ calendars, sync });
      const updated = calendars.find((calendar) => calendar.id === calendarId);
      if (updated) {
        await putNode('calendar', calendarId, updated as any);
      }
    } catch (err) {
      console.error("Failed to toggle calendar:", err);
      set({ error: "Failed to toggle calendar" });
    }
  },

  async createEvent(event, calendarId: string) {
    set({ error: null });
    try {
      const created: CalendarEvent = {
        ...event,
        id: event.id ?? generateId(),
      };
      const events = [...get().events, created].sort((a, b) => a.startAt - b.startAt);
      await addEdge(created.id, EDGE.BELONGS_TO, calendarId);
      if (created.guests) {
        for (const guest of created.guests) {
          await addEdge(created.id, EDGE.HAS_GUEST, guest.id);
        }
      }
      set({
        events,
        eventCalendarIds: { ...get().eventCalendarIds, [created.id]: calendarId },
        sync: recomputeSync(get().calendars, events),
        selectedEventId: created.id,
      });
      await putNode('calendar_event', created.id, created as any);
      const identity = useIdentityStore.getState().identity;
      const pool = useRelaysStore.getState().pool;
      if (identity && pool) {
        publishCalendarEvent(created, calendarId, identity, pool).catch(() => {});
      }
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
      await putNode('calendar_event', eventId, updated as any);
      const identity = useIdentityStore.getState().identity;
      const pool = useRelaysStore.getState().pool;
      if (identity && pool) {
        const calendarId = get().eventCalendarIds[eventId];
        if (calendarId) publishCalendarEvent(updated, calendarId, identity, pool).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to update event:", err);
      set({ error: "Failed to update event" });
    }
  },

  async deleteEvent(eventId) {
    set({ error: null });
    try {
      const events = get().events.filter((event) => event.id !== eventId);
      const { [eventId]: _, ...restCalendarIds } = get().eventCalendarIds;
      set({ events, eventCalendarIds: restCalendarIds, sync: recomputeSync(get().calendars, events), selectedEventId: get().selectedEventId === eventId ? null : get().selectedEventId });
      await deleteNode(eventId);
      const identity = useIdentityStore.getState().identity;
      const pool = useRelaysStore.getState().pool;
      if (identity && pool) {
        deleteCalendarEventOnRelay(eventId, identity, pool).catch(() => {});
      }
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
      const calendarId = get().eventCalendarIds[eventId] ?? "personal";
      const copy = await get().createEvent({
        ...sourceData,
        title: `${source.title} copy`,
        startAt: addHours(source.startAt, 1).getTime(),
        endAt: addHours(source.endAt, 1).getTime(),
        guests: source.guests ? source.guests.map((guest) => ({ ...guest })) : undefined,
      }, calendarId);
      return copy;
    } catch (err) {
      console.error("Failed to duplicate event:", err);
      set({ error: "Failed to duplicate event" });
      return null;
    }
  },
}));
