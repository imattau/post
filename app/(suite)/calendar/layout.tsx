import type { ReactNode } from "react";

export default function CalendarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-canvas text-text-primary">
      {children}
    </div>
  );
}
