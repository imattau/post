"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useIdentityStore } from "@/lib/stores/identity";
import { useMessagesStore } from "@/lib/stores/messages";
import AppSwitcher from "./AppSwitcher";
import IdentityDialog from "./IdentityDialog";

const AVATAR_COLORS = [
  "bg-avatar-1", "bg-avatar-2", "bg-avatar-3", "bg-avatar-4",
  "bg-avatar-5", "bg-avatar-6", "bg-avatar-7",
];

const TILES: Array<{ letter: string; label: string; route: string }> = [
  { letter: "M", label: "Post", route: "/mail/inbox" },
  { letter: "D", label: "Drive", route: "/drive" },
  { letter: "C", label: "Calendar", route: "/calendar" },
  { letter: "N", label: "Notes", route: "/coming-soon?app=N" },
  { letter: "P", label: "Contacts", route: "/contacts" },
  { letter: "T", label: "Tasks", route: "/coming-soon?app=T" },
];

function hashInitials(initials: string): number {
  let hash = 0;
  for (let i = 0; i < initials.length; i++) hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

export default function IconDock() {
  const pathname = usePathname();
  const router = useRouter();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [identityOpen, setIdentityOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [query, setQuery] = useState("");
  const identity = useIdentityStore((s) => s.identity);
  const messageIds = useMessagesStore((s) => s.ids);
  const messagesById = useMessagesStore((s) => s.byId);
  const messages = useMemo(
    () => messageIds.map((id) => messagesById[id]).filter(Boolean),
    [messageIds, messagesById]
  );
  const toggleSwitcher = () => setSwitcherOpen((v) => !v);
  const navigateTo = useCallback((route: string) => router.push(route), [router]);

  const avatarInitial = identity?.npub?.slice(5, 6)?.toUpperCase() || "?";
  const colorClass = AVATAR_COLORS[hashInitials(avatarInitial) % AVATAR_COLORS.length];
  const activeLetter = pathname.startsWith("/calendar")
    ? "C"
    : pathname.startsWith("/drive")
      ? "D"
      : pathname.startsWith("/contacts")
        ? "P"
        : "M";
  const inactiveTiles = TILES.filter((tile) => tile.letter !== activeLetter);
  const searchResults = messages.filter((message) => {
    const q = query.trim().toLowerCase();
    if (!q) return false;
    return message.subject.toLowerCase().includes(q) || message.content.toLowerCase().includes(q) || message.pubkey.toLowerCase().includes(q);
  }).slice(0, 5);

  return (
    <div className="w-[72px] h-dvh flex-shrink-0 bg-dock border-r border-border flex flex-col items-center pt-[18px]">
      {/* Logo — always "N" */}
      <div className="w-10 h-10 rounded-tile bg-brand flex items-center justify-center flex-shrink-0">
        <span className="text-white text-[17px] font-bold">N</span>
      </div>

      {/* Active app */}
      <button
        onClick={toggleSwitcher}
        className="mt-[24px] w-10 h-10 rounded-tile-2 bg-surface-active border border-brand flex items-center justify-center flex-shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-dock"
      >
        <span className="text-brand-light text-[14px] font-semibold">{activeLetter}</span>
      </button>

      {/* Inactive apps — click navigates directly */}
      {inactiveTiles.map((tile) => (
        <button
          key={tile.letter}
          onClick={() => navigateTo(tile.route)}
          className="mt-[10px] w-10 h-10 rounded-tile-2 border border-border bg-transparent flex items-center justify-center flex-shrink-0 cursor-pointer hover:brightness-125 transition-[brightness] duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-dock"
        >
          <span className="text-text-secondary text-[14px] font-semibold">{tile.letter}</span>
        </button>
      ))}

      {/* Hairline divider */}
      <div className="mt-[18px] w-10 h-px bg-border" />

      {/* Search */}
      <button onClick={() => setSearchOpen(true)} className="mt-[19px] w-10 h-10 rounded-tile-2 border border-border bg-transparent flex items-center justify-center flex-shrink-0 cursor-pointer hover:brightness-125 transition-[brightness] duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-dock">
        <span className="text-text-secondary text-[14px] font-semibold">⌕</span>
      </button>

      {/* Help */}
      <button onClick={() => setHelpOpen(true)} className="mt-[10px] w-10 h-10 rounded-tile-2 border border-border bg-transparent flex items-center justify-center flex-shrink-0 cursor-pointer hover:brightness-125 transition-[brightness] duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-dock">
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
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSearchOpen(false)}>
          <div className="absolute left-24 top-20 w-[360px] rounded-[14px] border border-border bg-modal-card p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-text-modal">Search messages</p>
              <button onClick={() => setSearchOpen(false)} className="text-[18px] text-text-modal-2 hover:text-text-modal">×</button>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder="Search subjects, content or pubkeys"
              className="mt-3 h-9 w-full rounded-[10px] border border-border bg-sidebar px-3 text-[12px] text-text-primary outline-none placeholder-text-placeholder"
            />
            <div className="mt-3 space-y-1">
              {query.trim() && searchResults.length === 0 && <p className="text-[12px] text-text-tertiary">No messages found.</p>}
              {searchResults.map((message) => (
                <a key={message.id} href={`/mail/${message.mailbox === "archive" ? "archive" : message.mailbox}?c=${message.id}`} className="block rounded-[8px] px-2 py-2 no-underline hover:bg-surface-active">
                  <p className="truncate text-[12px] font-medium text-text-primary">{message.subject || "(no subject)"}</p>
                  <p className="truncate text-[11px] text-text-tertiary">{message.preview || message.content}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setHelpOpen(false)}>
          <div className="absolute left-24 top-36 w-[320px] rounded-[14px] border border-border bg-modal-card p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-text-modal">Post help</p>
              <button onClick={() => setHelpOpen(false)} className="text-[18px] text-text-modal-2 hover:text-text-modal">×</button>
            </div>
            <div className="mt-3 space-y-2 text-[12px] text-text-modal-2">
              <p>Use the mailbox sidebar to move between inboxes, labels, drafts, and sent messages.</p>
              <p>Arrow keys move through message lists. Escape clears the current message selection.</p>
              <p>Version 0.1.0</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
