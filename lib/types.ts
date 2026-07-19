export type DriveScreen = "my-files" | "recent" | "starred" | "shared" | "offline" | "from-post" | "trash";

export type CalendarViewMode = "month" | "week" | "agenda";
export type CalendarAvailability = "free" | "busy" | "tentative" | "out";

export interface CalendarCalendar {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  availability: CalendarAvailability;
}

export interface CalendarGuest {
  id: string;
  initials: string;
  name: string;
  accepted: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  calendarId: string;
  startAt: number;
  endAt: number;
  allDay?: boolean;
  location?: string;
  description?: string;
  guests?: CalendarGuest[];
  meetingLabel?: string;
  invitation?: "accepted" | "pending" | "maybe" | "declined";
  syncStatus?: string;
  noteTitle?: string;
  noteBody?: string;
  attachedNote?: string;
  colorOverride?: string;
}

export interface CalendarSyncState {
  syncedCalendars: number;
  pendingInvitations: number;
  healthyRelays: number;
  updatedAt: number;
}

export type CalendarScreen = "month" | "detail";

export type {
  Profile,
  Identity,
  RelayConfig,
  RelayStatus,
  MailboxKind,
  AttachmentRef,
  AttachmentUpload,
  Message,
  Label,
  RecipientEntry,
  Draft,
  GroupInbox,
  Contact,
  DriveFile,
  DriveFolder,
  DriveUploadJob,
  DriveViewMode,
  DriveFilter,
  DriveSort,
  DriveSource,
  DriveFileKind,
  EncryptedBlobMetadata,
  SendResult,
  SendOptions,
} from "@post/nostr-core";
