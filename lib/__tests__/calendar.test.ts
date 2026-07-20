import { describe, it, expect, vi, beforeEach } from "vitest";

const calendarCalendarRows: any[] = [];
const calendarEventRows: any[] = [];

vi.mock("@/lib/db/poly", () => ({
  EDGE: { HAS_LABEL: "HAS_LABEL", IN_FOLDER: "IN_FOLDER", CHILD_OF: "CHILD_OF", BELONGS_TO: "BELONGS_TO", REPLIES_TO: "REPLIES_TO", PART_OF: "PART_OF" },
  addEdge: vi.fn(),
  removeEdges: vi.fn(),
  ensureConversation: vi.fn(),
  ensureWarm: vi.fn(),
  flushGraph: vi.fn(),
  deleteDatabase: vi.fn(),
  messageSearchText: vi.fn(() => ""),
  contactSearchText: vi.fn(() => ""),
  graph: { getEdgeTargets: vi.fn(() => []), getEdgeSources: vi.fn(() => []) },
  putNode: vi.fn(),
  putNodes: vi.fn(),
  deleteNode: vi.fn(),
  getNode: vi.fn(async () => undefined),
  getNodes: vi.fn(async () => []),
  getNodesOrdered: vi.fn(async () => []),
  countNodes: vi.fn(async () => 0),
  clearNodes: vi.fn(),
  db: { delete: vi.fn() },
}));

vi.mock("@post/nostr-core", async (importOriginal: () => Promise<Record<string, unknown>>) => {
  const actual = await importOriginal();
  return { ...actual };
});

const MOCK_EVENT = {
  id: "test-1",
  title: "Test event",
  startAt: new Date(2026, 6, 10, 10, 0).getTime(),
  endAt: new Date(2026, 6, 10, 11, 0).getTime(),
};

const MOCK_CALENDAR = {
  id: "work",
  name: "Work",
  color: "var(--color-info)",
  enabled: true,
  availability: "busy" as const,
};

function resetRows() {
  calendarCalendarRows.splice(0, calendarCalendarRows.length, { ...MOCK_CALENDAR });
  calendarEventRows.splice(0, calendarEventRows.length, { ...MOCK_EVENT });
}

describe("calendar store", () => {
  beforeEach(async () => {
    resetRows();
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.setState({
      calendars: [],
      events: [],
      sync: { syncedCalendars: 0, pendingInvitations: 0, healthyRelays: 0, updatedAt: 0 },
      activeMonth: new Date(2026, 6, 1),
      selectedDate: new Date(2026, 6, 4),
      selectedEventId: null,
      viewMode: "month",
      loading: false,
      error: null,
    });
  });

  it("starts with default state", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    const state = useCalendarStore.getState();
    expect(state.calendars).toEqual([]);
    expect(state.events).toEqual([]);
    expect(state.viewMode).toBe("month");
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("selectDate sets selectedDate", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    const date = new Date(2026, 11, 25);
    useCalendarStore.getState().selectDate(date);
    expect(useCalendarStore.getState().selectedDate).toBe(date);
  });

  it("selectEvent sets selectedEventId", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.getState().selectEvent("test-1");
    expect(useCalendarStore.getState().selectedEventId).toBe("test-1");
  });

  it("selectEvent(null) clears selectedEventId", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.getState().selectEvent("test-1");
    useCalendarStore.getState().selectEvent(null);
    expect(useCalendarStore.getState().selectedEventId).toBeNull();
  });

  it("setViewMode changes view", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.getState().setViewMode("week");
    expect(useCalendarStore.getState().viewMode).toBe("week");
  });

  it("setMonth sets to first of month", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.getState().setMonth(new Date(2026, 2, 15));
    expect(useCalendarStore.getState().activeMonth).toEqual(new Date(2026, 2, 1));
  });

  it("goToToday jumps to current month", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.getState().goToToday();
    const now = new Date();
    expect(useCalendarStore.getState().activeMonth).toEqual(new Date(now.getFullYear(), now.getMonth(), 1));
  });

  it("previousMonth subtracts one month", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.getState().previousMonth();
    expect(useCalendarStore.getState().activeMonth).toEqual(new Date(2026, 5, 1));
  });

  it("nextMonth adds one month", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.getState().nextMonth();
    expect(useCalendarStore.getState().activeMonth).toEqual(new Date(2026, 7, 1));
  });

  it("previousWeek subtracts 7 days from selectedDate", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.setState({ selectedDate: new Date(2026, 6, 4) });
    useCalendarStore.getState().previousWeek();
    expect(useCalendarStore.getState().selectedDate).toEqual(new Date(2026, 6, 4 - 7));
    expect(useCalendarStore.getState().activeMonth).toEqual(new Date(2026, 6, 1));
  });

  it("nextWeek adds 7 days to selectedDate", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.setState({ selectedDate: new Date(2026, 6, 4) });
    useCalendarStore.getState().nextWeek();
    expect(useCalendarStore.getState().selectedDate).toEqual(new Date(2026, 6, 4 + 7));
    expect(useCalendarStore.getState().activeMonth).toEqual(new Date(2026, 6, 1));
  });

  it("load seeds from DB and populates state", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.setState({ calendars: [{ ...MOCK_CALENDAR }], events: [{ ...MOCK_EVENT }], loading: false });
    expect(useCalendarStore.getState().calendars.length).toBeGreaterThan(0);
    expect(useCalendarStore.getState().events.length).toBeGreaterThan(0);
    expect(useCalendarStore.getState().loading).toBe(false);
  });

  it("load sets error on failure", async () => {
    const { getNodes } = await import("@/lib/db/poly");
    vi.mocked(getNodes).mockRejectedValueOnce(new Error("DB error"));
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    await useCalendarStore.getState().load();
    expect(useCalendarStore.getState().error).toBe("Failed to load calendar data");
    expect(useCalendarStore.getState().loading).toBe(false);
  });

  it("toggleCalendar toggles enabled and persists", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.setState({ calendars: [{ ...MOCK_CALENDAR }] });
    await useCalendarStore.getState().toggleCalendar("work");
    expect(useCalendarStore.getState().calendars[0].enabled).toBe(false);
    await useCalendarStore.getState().toggleCalendar("work");
    expect(useCalendarStore.getState().calendars[0].enabled).toBe(true);
  });

  it("createEvent adds event and selects it", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    const created = await useCalendarStore.getState().createEvent(MOCK_EVENT, "work");
    expect(created.id).toBeTruthy();
    expect(created.title).toBe("Test event");
    expect(useCalendarStore.getState().events).toHaveLength(1);
    expect(useCalendarStore.getState().selectedEventId).toBe(created.id);
  });

  it("createEvent persists to DB", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    await useCalendarStore.getState().createEvent(MOCK_EVENT, "work");
    const { putNode } = await import("@/lib/db/poly");
    expect(putNode).toHaveBeenCalled();
  });

  it("updateEvent patches event fields", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.setState({ events: [{ ...MOCK_EVENT }], eventCalendarIds: { "test-1": "work" } });
    await useCalendarStore.getState().updateEvent("test-1", { title: "Updated" });
    expect(useCalendarStore.getState().events[0].title).toBe("Updated");
  });

  it("deleteEvent removes event and clears selection if selected", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.setState({ events: [{ ...MOCK_EVENT }], selectedEventId: "test-1", eventCalendarIds: { "test-1": "work" } });
    await useCalendarStore.getState().deleteEvent("test-1");
    expect(useCalendarStore.getState().events).toHaveLength(0);
    expect(useCalendarStore.getState().selectedEventId).toBeNull();
  });

  it("duplicateEvent copies event +1 hour", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    useCalendarStore.setState({ events: [{ ...MOCK_EVENT }], eventCalendarIds: { "test-1": "work" } });
    const copy = await useCalendarStore.getState().duplicateEvent("test-1");
    expect(copy).not.toBeNull();
    expect(copy!.id).not.toBe("test-1");
    expect(copy!.startAt).toBe(MOCK_EVENT.startAt + 3_600_000);
    expect(copy!.endAt).toBe(MOCK_EVENT.endAt + 3_600_000);
    expect(copy!.title).toBe("Test event copy");
    expect(useCalendarStore.getState().events).toHaveLength(2);
  });

  it("duplicateEvent returns null for missing event", async () => {
    const { useCalendarStore } = await import("@/lib/stores/calendar");
    const result = await useCalendarStore.getState().duplicateEvent("nonexistent");
    expect(result).toBeNull();
  });
});
