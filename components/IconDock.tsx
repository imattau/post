"use client";

import { useState } from "react";
import { useIdentityStore } from "@/lib/stores/identity";
import AppSwitcher from "./AppSwitcher";
import IdentityDialog from "./IdentityDialog";

const AVATAR_COLORS = [
  "bg-avatar-1", "bg-avatar-2", "bg-avatar-3", "bg-avatar-4",
  "bg-avatar-5", "bg-avatar-6", "bg-avatar-7",
];

const INACTIVE_TILES = [
  { letter: "D", label: "Drive" },
  { letter: "C", label: "Calendar" },
  { letter: "N", label: "Notes" },
  { letter: "P", label: "Contacts" },
];

function hashInitials(initials: string): number {
  let hash = 0;
  for (let i = 0; i < initials.length; i++) hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

export default function IconDock() {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [identityOpen, setIdentityOpen] = useState(false);
  const identity = useIdentityStore((s) => s.identity);
  const toggleSwitcher = () => setSwitcherOpen((v) => !v);

  const avatarInitial = identity?.npub?.slice(5, 6)?.toUpperCase() || "?";
  const colorClass = AVATAR_COLORS[hashInitials(avatarInitial) % AVATAR_COLORS.length];

  return (
    <div className="w-[72px] h-dvh flex-shrink-0 bg-dock border-r border-border flex flex-col items-center pt-[18px]">
      {/* Logo — always "N" */}
      <div className="w-10 h-10 rounded-tile bg-brand flex items-center justify-center flex-shrink-0">
        <span className="text-white text-[17px] font-bold">N</span>
      </div>

      {/* Active app — Post (M) */}
      <button
        onClick={toggleSwitcher}
        className="mt-[24px] w-10 h-10 rounded-tile-2 bg-surface-active border border-brand flex items-center justify-center flex-shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-dock"
      >
        <span className="text-brand-light text-[14px] font-semibold">M</span>
      </button>

      {/* Inactive apps */}
      {INACTIVE_TILES.map((tile) => (
        <button
          key={tile.letter}
          onClick={toggleSwitcher}
          className="mt-[10px] w-10 h-10 rounded-tile-2 border border-border bg-transparent flex items-center justify-center flex-shrink-0 cursor-pointer hover:brightness-125 transition-[brightness] duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-dock"
        >
          <span className="text-text-secondary text-[14px] font-semibold">{tile.letter}</span>
        </button>
      ))}

      {/* Hairline divider */}
      <div className="mt-[18px] w-10 h-px bg-border" />

      {/* Search */}
      <button className="mt-[19px] w-10 h-10 rounded-tile-2 border border-border bg-transparent flex items-center justify-center flex-shrink-0 cursor-pointer hover:brightness-125 transition-[brightness] duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-dock">
        <span className="text-text-secondary text-[14px] font-semibold">⌕</span>
      </button>

      {/* Help */}
      <button className="mt-[10px] w-10 h-10 rounded-tile-2 border border-border bg-transparent flex items-center justify-center flex-shrink-0 cursor-pointer hover:brightness-125 transition-[brightness] duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-dock">
        <span className="text-text-secondary text-[14px] font-semibold">?</span>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Avatar — click to open identity dialog */}
      <button onClick={() => setIdentityOpen(true)} className="relative w-9 h-9 flex-shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-dock rounded-full">
        <div className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center`}>
          <span className="text-white text-[11px] font-semibold">{avatarInitial}</span>
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-ok border-[1.5px] border-dock" />
      </button>

      {/* App Switcher popover */}
      {switcherOpen && <AppSwitcher onClose={() => setSwitcherOpen(false)} />}

      {/* Identity dialog */}
      {identityOpen && <IdentityDialog onClose={() => setIdentityOpen(false)} />}
    </div>
  );
}
