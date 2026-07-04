import type { CalendarCalendar, CalendarEvent, CalendarGuest, CalendarSyncState } from "@/lib/types";

const base = new Date(2026, 6, 1);
const at = (day: number, hour: number, minute = 0) => new Date(2026, 6, day, hour, minute).getTime();

export const CALENDAR_SYNC: CalendarSyncState = {
  syncedCalendars: 4,
  pendingInvitations: 2,
  healthyRelays: 5,
  updatedAt: Date.now() - 12_000,
};

export const CALENDARS: CalendarCalendar[] = [
  { id: "personal", name: "Personal", color: "var(--color-brand)", enabled: true, availability: "busy" },
  { id: "work", name: "Work", color: "var(--color-info)", enabled: true, availability: "busy" },
  { id: "family", name: "Family", color: "var(--color-ok)", enabled: true, availability: "busy" },
  { id: "birthdays", name: "Birthdays", color: "var(--color-warn)", enabled: true, availability: "tentative" },
  { id: "public", name: "Public events", color: "var(--color-danger)", enabled: true, availability: "free" },
];

const guests: CalendarGuest[] = [
  { id: "alice", initials: "AL", name: "Alice Nguyen", accepted: true },
  { id: "jonas", initials: "JB", name: "Jonas Berg", accepted: true },
  { id: "sofia", initials: "SK", name: "Sofia Kim", accepted: true },
  { id: "lena", initials: "LC", name: "Lena Chen", accepted: true },
  { id: "daniel", initials: "D", name: "Daniel Reed", accepted: false },
  { id: "mila", initials: "M", name: "Mila", accepted: false },
];

export const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "design-review",
    title: "Design review",
    calendarId: "work",
    startAt: at(1, 10, 0),
    endAt: at(1, 11, 0),
    description: "Review the latest UI direction and confirm the shared surface language.",
    meetingLabel: "Video call",
  },
  {
    id: "school-pickup",
    title: "School pickup",
    calendarId: "family",
    startAt: at(2, 15, 30),
    endAt: at(2, 16, 0),
  },
  {
    id: "swimming-lesson",
    title: "Swimming lesson",
    calendarId: "personal",
    startAt: at(4, 17, 0),
    endAt: at(4, 18, 0),
  },
  {
    id: "suite-planning",
    title: "Suite planning",
    calendarId: "work",
    startAt: at(7, 11, 0),
    endAt: at(7, 12, 0),
    location: "Nostr Room",
    description:
      "Review the Post and Drive flows, confirm the shared design system, and plan the Calendar implementation.",
    guests,
    meetingLabel: "Nostr Room · encrypted",
    invitation: "accepted",
    syncStatus: "Published to 4 relays",
    noteTitle: "Suite planning agenda.md",
    noteBody: "Attached note",
    attachedNote: "Suite planning agenda.md",
  },
  {
    id: "relay-call",
    title: "Relay community call",
    calendarId: "public",
    startAt: at(9, 9, 0),
    endAt: at(9, 10, 0),
  },
  {
    id: "dentist",
    title: "Dentist",
    calendarId: "personal",
    startAt: at(14, 14, 15),
    endAt: at(14, 15, 0),
  },
  {
    id: "product-demo",
    title: "Product demo",
    calendarId: "work",
    startAt: at(16, 11, 0),
    endAt: at(16, 12, 0),
  },
  {
    id: "monthly-review",
    title: "Monthly review",
    calendarId: "personal",
    startAt: at(21, 10, 0),
    endAt: at(21, 11, 0),
  },
  {
    id: "annual-leave",
    title: "Annual leave",
    calendarId: "work",
    startAt: at(22, 9, 0),
    endAt: at(24, 17, 0),
    allDay: true,
  },
  {
    id: "family-dinner",
    title: "Family dinner",
    calendarId: "family",
    startAt: at(24, 18, 0),
    endAt: at(24, 20, 0),
  },
  {
    id: "photo-walk",
    title: "Photo walk",
    calendarId: "birthdays",
    startAt: at(29, 8, 0),
    endAt: at(29, 9, 30),
  },
];

export const CALENDAR_MONTH = new Date(base.getFullYear(), base.getMonth(), 1);
export const CALENDAR_SELECTED_DAY = new Date(2026, 6, 4);
