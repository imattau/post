"use client";

import { useState } from "react";
import AppSwitcher from "./AppSwitcher";

const INACTIVE_TILES = [
  { letter: "D", label: "Drive" },
  { letter: "C", label: "Calendar" },
  { letter: "N", label: "Notes" },
  { letter: "P", label: "Contacts" },
];

export default function IconDock() {
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const toggleSwitcher = () => setSwitcherOpen((v) => !v);

  return (
    <div className="w-[72px] h-dvh flex-shrink-0 bg-dock flex flex-col items-center py-3 gap-2">
      {/* Logo — always "N" */}
      <div className="w-10 h-10 rounded-tile bg-brand flex items-center justify-center flex-shrink-0">
        <span className="text-white text-[17px] font-bold">N</span>
      </div>

      {/* Active app — Post (M) */}
      <button
        onClick={toggleSwitcher}
        className="w-10 h-10 rounded-tile-2 bg-surface-active border border-brand flex items-center justify-center flex-shrink-0 cursor-pointer"
      >
        <span className="text-brand-light text-[17px] font-bold">M</span>
      </button>

      {/* Inactive apps — clicking opens app switcher */}
      {INACTIVE_TILES.map((tile) => (
        <button
          key={tile.letter}
          onClick={toggleSwitcher}
          className="w-10 h-10 rounded-tile-2 border border-border bg-transparent flex items-center justify-center flex-shrink-0 cursor-pointer hover:brightness-125 transition-[brightness] duration-150"
        >
          <span className="text-text-secondary text-[17px] font-bold">{tile.letter}</span>
        </button>
      ))}

      {/* Hairline divider */}
      <div className="w-[28px] h-px bg-border my-1" />

      {/* Search */}
      <button className="w-10 h-10 rounded-tile-2 border border-border bg-transparent flex items-center justify-center flex-shrink-0 cursor-pointer hover:brightness-125 transition-[brightness] duration-150">
        <span className="text-text-secondary text-[15px]">⌕</span>
      </button>

      {/* Help */}
      <button className="w-10 h-10 rounded-tile-2 border border-border bg-transparent flex items-center justify-center flex-shrink-0 cursor-pointer hover:brightness-125 transition-[brightness] duration-150">
        <span className="text-text-secondary text-[15px] font-semibold">?</span>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Avatar */}
      <div className="relative w-9 h-9 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-avatar-6 flex items-center justify-center">
          <span className="text-white text-[11px] font-semibold">?</span>
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-ok border-[1.5px] border-dock" />
      </div>

      {/* App Switcher popover */}
      {switcherOpen && <AppSwitcher onClose={() => setSwitcherOpen(false)} />}
    </div>
  );
}
