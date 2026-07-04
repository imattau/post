"use client";

import type { ReactNode } from "react";

export default function OptionCard({
  icon,
  title,
  description,
  highlighted,
  onClick,
  rightElement,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  highlighted?: boolean;
  onClick?: () => void;
  rightElement?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full h-[88px] rounded-[14px] border px-4 text-left transition-all cursor-pointer ${
        highlighted
          ? "bg-surface-active border-brand"
          : "bg-sidebar border-border hover:bg-pill-subtle"
      }`}
    >
      <div className="flex items-center justify-center w-[48px] h-[48px] rounded-[12px] bg-pill-subtle shrink-0">
        {icon}
      </div>
      <div className="ml-4 flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-text-near-white">{title}</p>
        <p className="text-[10px] font-normal text-text-tertiary mt-1">{description}</p>
      </div>
      {rightElement ?? (
        <span className="text-[20px] font-medium text-text-tertiary ml-2 shrink-0">›</span>
      )}
    </button>
  );
}
