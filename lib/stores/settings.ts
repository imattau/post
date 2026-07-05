import { create } from "zustand";

type SettingValue = boolean | string | number;

export const SETTING_DEFAULTS = {
  // Account
  "default-start-app": "post",
  "cross-app-search": true,
  "account-switching": true,
  // General > Compose
  "default-post-visibility": "last",
  "encrypt-direct-posts": true,
  "autosave-drafts": true,
  "relay-delivery-preview": true,
  // General > Reading
  "built-in-reader": true,
  "reply-same-format": true,
  "quote-original-post": false,
  // Post > Compose & replies
  "default-signature": "none",
  // Post > Reading
  "show-images-inline": true,
  "mark-read-scroll": true,
  // Drive > Uploads
  "encrypt-private-uploads": true,
  "background-uploads": true,
  // Drive > Sharing
  "default-share-permission": "read",
  // Drive > Offline files
  "enable-offline-files": true,
  // Drive > Versions
  "enable-file-versions": true,
  "version-retention": "90",
  // Calendar > Appearance
  "week-start-day": "monday",
  "default-calendar-view": "month",
  "show-weekends": true,
  // Calendar > Notifications
  "notify-event-reminders": true,
  "notify-invitations": true,
  "notify-calendar-changes": false,
  // Calendar > Sync
  "automatic-calendar-sync": true,
  // Notes > General
  "notes-default-view": "grid",
  "notes-sort-order": "updated",
  "notes-encrypt-default": true,
  // Notifications
  "notify-private-posts": true,
  "notify-mentions": true,
  "notify-digests": false,
  "notify-delivery-failures": true,
  // Appearance
  "theme": "dark" as string,
  "density": "comfortable",
  "show-avatar-previews": true,
  // Privacy & security
  "encrypt-attachments": true,
  "hide-notification-content": false,
  // Relays & network
  "automatic-relay-selection": true,
  "download-profile-metadata": true,
  "prefer-recipient-relays": true,
  // Advanced
  "developer-mode": false,
  "debug-logging": false,
  // Blossom (migrated from separate localStorage key)
  "blossom-server-url": "" as string,
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type SettingValueOf<K extends SettingKey> = typeof SETTING_DEFAULTS[K];

type SettingsMap = { [K in SettingKey]?: SettingValueOf<K> };

interface SettingsState {
  values: SettingsMap;
  setValue: <K extends SettingKey>(key: K, value: SettingValueOf<K>) => void;
  getValue: <K extends SettingKey>(key: K, fallback: SettingValueOf<K>) => SettingValueOf<K>;
  load: () => void;
  reset: () => void;
}

const STORAGE_KEY = "post-settings";
const LEGACY_BLOSSOM_KEY = "blossom-server-url";

function readValues(): SettingsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: Record<string, SettingValue> = raw ? JSON.parse(raw) : {};

    const migrated = { ...parsed };

    // Migrate legacy blossom-server-url into settings store
    const legacyBlossom = localStorage.getItem(LEGACY_BLOSSOM_KEY);
    if (legacyBlossom !== null && !(LEGACY_BLOSSOM_KEY in migrated)) {
      migrated[LEGACY_BLOSSOM_KEY] = legacyBlossom;
    }
    localStorage.removeItem(LEGACY_BLOSSOM_KEY);

    return migrated as SettingsMap;
  } catch {
    return {};
  }
}

function writeValues(values: SettingsMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Ignore storage failures.
  }
}

function resetStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  values: {},

  setValue: (key, value) => {
    const values = { ...get().values, [key]: value } as SettingsMap;
    writeValues(values);
    set({ values });
  },

  getValue: (key, fallback) => {
    const value = get().values[key];
    return (value ?? fallback) as SettingValueOf<typeof key>;
  },

  load: () => {
    set({ values: readValues() });
  },

  reset: () => {
    resetStorage();
    set({ values: {} });
  },
}));
