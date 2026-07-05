"use client";

import { useSettingsStore, SETTING_DEFAULTS, type SettingKey } from "@/lib/stores/settings";

export function ToggleRow({ settingKey, label, description, defaultOn }: { settingKey: SettingKey; label: string; description: string; defaultOn?: boolean }) {
  const value = useSettingsStore((s) => s.values[settingKey]);
  const setValue = useSettingsStore((s) => s.setValue);
  const fallback = defaultOn ?? (SETTING_DEFAULTS[settingKey] as boolean | undefined) ?? false;
  const on = typeof value === "boolean" ? value : fallback;
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <p className="text-[14px] font-medium text-text-primary">{label}</p>
        <p className="text-[11px] text-text-tertiary mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setValue(settingKey, !on)}
        className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer ${
          on ? "bg-brand" : "bg-pill-subtle"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
            on ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
