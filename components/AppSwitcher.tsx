"use client";

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";

interface AppTile {
  letter: string;
  name: string;
  color: string;
  route: string;
}

const APPS: AppTile[] = [
  { letter: "M", name: "Post", color: "var(--color-brand)", route: "/mail/inbox" },
  { letter: "D", name: "Drive", color: "var(--color-info)", route: "/drive" },
  { letter: "C", name: "Calendar", color: "var(--color-teal)", route: "/calendar" },
  { letter: "N", name: "Notes", color: "var(--color-warn)", route: "/coming-soon?app=N" },
  { letter: "P", name: "Contacts", color: "var(--color-danger)", route: "/contacts" },
  { letter: "T", name: "Tasks", color: "var(--color-teal)", route: "/coming-soon?app=T" },
];

export default function AppSwitcher({ onClose }: { onClose: () => void }) {
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Popup className="fixed z-50 w-[280px] h-[300px] rounded-[18px] border border-border bg-pill-subtle shadow-[0_20px_40px_0_rgba(0,0,0,0.5)] outline-none"
          style={{ top: 74, left: 1112 }}>
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <span className="text-text-primary text-[13px] font-semibold">Nostr Suite</span>
            <Link href="/coming-soon?app=all" onClick={onClose} className="text-brand-light text-[11px] font-medium hover:brightness-110">All apps</Link>
          </div>
          <div className="grid grid-cols-3 gap-3 px-5 py-2">
            {APPS.map((app) => (
              <Link
                key={app.letter}
                href={app.route}
                onClick={onClose}
                className="flex flex-col items-center gap-1.5 w-16 h-16 rounded-[16px] border border-border bg-transparent hover:brightness-125 transition-[brightness] duration-150"
              >
                <div
                  className="w-10 h-10 rounded-[11px] flex items-center justify-center mt-1.5"
                  style={{ backgroundColor: app.color + "20" }}
                >
                  <span className="text-[17px] font-bold" style={{ color: app.color }}>
                    {app.letter}
                  </span>
                </div>
                <span className="text-text-secondary text-[10px] font-medium">{app.name}</span>
              </Link>
            ))}
          </div>
          <p className="text-text-tertiary text-[10px] text-center mt-1 px-5">
            Shared identity · unified search · private by default
          </p>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
