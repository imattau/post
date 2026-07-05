"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, CircleHelp, Settings, X } from "lucide-react";
import { Command } from "cmdk";
import { useIdentityStore } from "@/lib/stores/identity";
import { useMessagesStore } from "@/lib/stores/messages";
import { createMessageSearch } from "@/lib/search";
import type { Message } from "@post/nostr-core";
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
  const toggleSwitcher = useCallback(() => setSwitcherOpen((v) => !v), []);
  const closeSwitcher = useCallback(() => setSwitcherOpen(false), []);
  const closeIdentity = useCallback(() => setIdentityOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  const avatarInitial = identity?.npub?.slice(5, 6)?.toUpperCase() || "?";
  const colorClass = useMemo(
    () => AVATAR_COLORS[hashInitials(avatarInitial) % AVATAR_COLORS.length],
    [avatarInitial]
  );
  const activeLetter = useMemo(() => pathname.startsWith("/calendar")
    ? "C"
    : pathname.startsWith("/drive")
      ? "D"
      : pathname.startsWith("/contacts")
        ? "P"
        : "M", [pathname]);
  const inactiveTiles = useMemo(
    () => TILES.filter((tile) => tile.letter !== activeLetter),
    [activeLetter]
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const search = useMemo(() => createMessageSearch(), []);

  useEffect(() => {
    if (!searchOpen) {
      setMessages([]);
      return;
    }
    const state = useMessagesStore.getState();
    setMessages(state.ids.map((id) => state.byId[id]).filter(Boolean));
    const unsub = useMessagesStore.subscribe((s) => {
      setMessages(s.ids.map((id) => s.byId[id]).filter(Boolean));
    });
    return unsub;
  }, [searchOpen]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return search.search(query, messages).slice(0, 5);
  }, [messages, query, search]);

  const handleSelect = useCallback((message: Message) => {
    const mailbox = message.mailbox === "archive" ? "archive" : message.mailbox;
    closeSearch();
    router.push(`/mail/${mailbox}?c=${message.id}`);
  }, [closeSearch, router]);

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
        <Link
          key={tile.letter}
          href={tile.route}
          className="mt-[10px] w-10 h-10 rounded-tile-2 border border-border bg-transparent flex items-center justify-center flex-shrink-0 hover:brightness-125 transition-[brightness] duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-dock"
        >
          <span className="text-text-secondary text-[14px] font-semibold">{tile.letter}</span>
        </Link>
      ))}

      {/* Hairline divider */}
      <div className="mt-[18px] w-10 h-px bg-border" />

      {/* Search */}
      <button onClick={() => setSearchOpen(true)} aria-label="Search" className="mt-[19px] w-10 h-10 rounded-tile-2 border border-border bg-transparent flex items-center justify-center flex-shrink-0 cursor-pointer hover:brightness-125 transition-[brightness] duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-dock">
        <Search size={14} className="text-text-secondary" />
      </button>

      {/* Help */}
      <button onClick={() => setHelpOpen(true)} aria-label="Help" className="mt-[10px] w-10 h-10 rounded-tile-2 border border-border bg-transparent flex items-center justify-center flex-shrink-0 cursor-pointer hover:brightness-125 transition-[brightness] duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-dock">
        <CircleHelp size={14} className="text-text-secondary" />
      </button>

      {/* Settings */}
      <Link href="/settings" aria-label="Settings" className="mt-[10px] w-10 h-10 rounded-tile-2 border border-border bg-transparent flex items-center justify-center flex-shrink-0 hover:brightness-125 transition-[brightness] duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-dock">
        <Settings size={14} className="text-text-secondary" />
      </Link>

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
      {switcherOpen && <AppSwitcher onClose={closeSwitcher} />}

      {/* Identity dialog */}
      {identityOpen && <IdentityDialog onClose={closeIdentity} />}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={closeSearch}>
          <div className="absolute left-24 top-20 w-[360px] rounded-[14px] border border-border bg-modal-card p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-text-modal">Search messages</p>
              <button onClick={closeSearch} className="text-text-modal-2 hover:text-text-modal"><X size={18} /></button>
            </div>
            <Command shouldFilter={false} className="mt-3">
              <Command.Input
                value={query}
                onValueChange={setQuery}
                autoFocus
                placeholder="Search subjects, content or pubkeys"
                className="h-9 w-full rounded-[10px] border border-border bg-sidebar px-3 text-[12px] text-text-primary outline-none placeholder:text-text-placeholder"
              />
              <Command.List className="mt-3 space-y-1">
                {query.trim() && searchResults.length === 0 && (
                  <p className="text-[12px] text-text-tertiary">No messages found.</p>
                )}
                {searchResults.map((message) => (
                  <Command.Item
                    key={message.id}
                    value={message.id}
                    onSelect={() => handleSelect(message)}
                    className="block rounded-[8px] px-2 py-2 no-underline hover:bg-surface-active data-[highlighted]:bg-surface-active cursor-pointer"
                  >
                    <p className="truncate text-[12px] font-medium text-text-primary">{message.subject || "(no subject)"}</p>
                    <p className="truncate text-[11px] text-text-tertiary">{message.preview || message.content}</p>
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={closeHelp}>
          <div className="absolute left-24 top-36 w-[320px] rounded-[14px] border border-border bg-modal-card p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-text-modal">Post help</p>
              <button onClick={closeHelp} className="text-text-modal-2 hover:text-text-modal"><X size={18} /></button>
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
