import { create } from "zustand";

type SettingValue = boolean | string | number;

interface SettingsState {
  values: Record<string, SettingValue>;
  setValue: (key: string, value: SettingValue) => void;
  getValue: <T extends SettingValue>(key: string, fallback: T) => T;
  load: () => void;
}

const STORAGE_KEY = "post-settings";

function readValues(): Record<string, SettingValue> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Record<string, SettingValue> : {};
  } catch {
    return {};
  }
}

function writeValues(values: Record<string, SettingValue>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Ignore storage failures.
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  values: {},

  setValue: (key, value) => {
    const values = { ...get().values, [key]: value };
    writeValues(values);
    set({ values });
  },

  getValue: (key, fallback) => {
    const value = get().values[key];
    return (value ?? fallback) as typeof fallback;
  },

  load: () => set({ values: readValues() }),
}));
