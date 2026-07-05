"use client";

import { useSettingsStore, SETTING_DEFAULTS, type SettingKey } from "@/lib/stores/settings";

export function SelectRow({ settingKey, label, description, options, defaultValue }: { settingKey: SettingKey; label: string; description: string; options: { value: string; label: string }[]; defaultValue?: string }) {
  const value = useSettingsStore((s) => s.values[settingKey]);
  const setValue = useSettingsStore((s) => s.setValue);
  const fallback = defaultValue ?? (SETTING_DEFAULTS[settingKey] as string | undefined) ?? "";
  const current = typeof value === "string" ? value : fallback;
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <p className="text-[14px] font-medium text-text-primary">{label}</p>
        <p className="text-[11px] text-text-tertiary mt-0.5">{description}</p>
      </div>
      <select
        value={current}
        onChange={(e) => setValue(settingKey, e.target.value)}
        className="h-9 px-3 rounded-[10px] bg-pill-subtle border border-border text-text-secondary text-[11px] font-medium text-center appearance-none cursor-pointer hover:brightness-110 transition-all flex-shrink-0"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
