"use client";

import { DayPicker } from "react-day-picker";

export default function CalendarMiniGrid({
  activeMonth,
  selectedDate,
  onPickMonth,
  onPickDate,
}: {
  activeMonth: Date;
  selectedDate: Date;
  onPickMonth: (month: Date) => void;
  onPickDate: (date: Date) => void;
}) {
  return (
    <DayPicker
      mode="single"
      selected={selectedDate}
      onSelect={(date) => date && onPickDate(date)}
      month={activeMonth}
      onMonthChange={onPickMonth}
      showOutsideDays={false}
      className="m-0"
      classNames={{
        root: "w-full",
        months: "flex flex-col",
        month: "space-y-2",
        month_grid: "w-full border-collapse",
        weekdays: "text-center",
        weekday: "text-[10px] text-text-tertiary font-normal",
        weeks: "",
        week: "",
        day: "text-center p-0 text-[10px]",
        day_button: "mx-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-text-secondary hover:bg-surface-active hover:text-text-near-white transition-colors",
        selected: "bg-brand text-white hover:bg-brand rounded-full",
        outside: "opacity-40",
        caption_label: "text-[13px] font-semibold text-text-near-white",
        nav: "flex gap-1",
        button_next: "flex h-5 w-5 items-center justify-center rounded-[6px] border border-border text-[12px] text-text-secondary hover:bg-surface-active hover:text-text-near-white transition-colors",
        button_previous: "flex h-5 w-5 items-center justify-center rounded-[6px] border border-border text-[12px] text-text-secondary hover:bg-surface-active hover:text-text-near-white transition-colors",
      }}
    />
  );
}
