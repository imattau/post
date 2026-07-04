"use client";

import type { ReactNode } from "react";
import CalendarSidebar from "./CalendarSidebar";

export type ActiveNav = "month" | "week" | "agenda" | "invitations" | "shared" | "settings";

export default function CalendarPageFrame({
  activeNav,
  title,
  subtitle,
  headerActions,
  children,
  rightRail,
}: {
  activeNav: ActiveNav | undefined;
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  children: ReactNode;
  rightRail?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-canvas text-text-primary">
      <CalendarSidebar activeNav={activeNav} />
      <div className="flex min-h-0 flex-1">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-5 pb-5 pt-[24px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[30px] font-semibold tracking-[-0.02em] text-text-near-white">{title}</h2>
              {subtitle && <p className="mt-1 text-[11px] text-text-tertiary">{subtitle}</p>}
            </div>
            {headerActions}
          </div>
          <div className="min-h-0 flex-1">{children}</div>
        </main>
        {rightRail && (
          <aside className="flex min-h-0 w-[352px] flex-col overflow-y-auto border-l border-border bg-canvas px-6 pb-5 pt-[24px]">
            {rightRail}
          </aside>
        )}
      </div>
    </div>
  );
}
