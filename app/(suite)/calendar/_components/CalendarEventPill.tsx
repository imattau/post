"use client";

const TONE_MAP: Record<string, string> = {
  "var(--color-brand)": "bg-[#4A2F82] border-l-brand",
  "var(--color-info)": "bg-[#1E3E6A] border-l-info",
  "var(--color-ok)": "bg-[#194A3A] border-l-ok",
  "var(--color-warn)": "bg-[#5A4520] border-l-warn",
};

function eventCardTone(color: string): string {
  return TONE_MAP[color] ?? "bg-[#5A2434] border-l-danger";
}

export default function CalendarEventPill({
  title,
  subtitle,
  color,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  color: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex min-h-[40px] flex-col justify-center gap-0.5 rounded-[8px] border border-white/5 border-l-[3px] px-2.5 py-1 text-left shadow-[0_10px_18px_rgba(0,0,0,0.12)] ${eventCardTone(color)} ${
        compact ? "text-[11px]" : "text-[12px]"
      }`}
    >
      <span className="font-medium leading-tight text-white">{title}</span>
      {subtitle && <span className="text-[10px] leading-tight text-white/70">{subtitle}</span>}
    </div>
  );
}
