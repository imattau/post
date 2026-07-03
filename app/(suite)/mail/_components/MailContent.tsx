"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { useRelaysStore } from "@/lib/stores/relays";
import { useLabelsStore } from "@/lib/stores/labels";
import { useMessagesStore } from "@/lib/stores/messages";
import { useMailboxMessages } from "../_components/useMailboxMessages";
import ReadingPane from "@/components/ReadingPane";
import ComposeModal from "@/components/ComposeModal";

export default function MailContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = searchParams.get("c");
  const composeOpen = searchParams.get("compose") === "true";

  const { messages } = useMailboxMessages("inbox");
  const selectedMessage = selectedId ? messages.find((m) => m.id === selectedId) ?? null : messages[0] ?? null;

  const labels = useLabelsStore((s) => s.byId);
  const labelIds = useLabelsStore((s) => s.allIds);

  const markRead = useMessagesStore((s) => s.markRead);
  const toggleStar = useMessagesStore((s) => s.toggleStar);
  const toggleArchive = useMessagesStore((s) => s.toggleArchive);
  const toggleSpam = useMessagesStore((s) => s.toggleSpam);

  const clearSelection = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const handleToggleStar = useCallback(
    (id: string) => {
      toggleStar(id);
    },
    [toggleStar]
  );

  const closeCompose = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const relayStatuses = useRelaysStore((s) => s.statuses);
  const healthPercent = useRelaysStore((s) => s.healthPercent);
  const syncedAgo = useRelaysStore((s) => s.syncedAgo);
  const connectedCount = Object.values(relayStatuses).filter((s) => s.connected).length;
  const totalCount = Object.keys(relayStatuses).length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedMessage && !composeOpen) clearSelection();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedMessage, composeOpen, clearSelection]);

  const relayConnected = Object.values(relayStatuses).some((s) => s.connected);

  const [showLabelInput, setShowLabelInput] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");

  const createLabel = useCallback(async () => {
    if (!newLabelName.trim()) return;
    const colors = ["#60A5FA", "#34D399", "#FBBF24", "#FB7185", "#A78BFA", "#14B8A6"];
    const color = colors[labelIds.length % colors.length];
    await useLabelsStore.getState().createLabel(newLabelName.trim(), color);
    setNewLabelName("");
    setShowLabelInput(false);
  }, [newLabelName, labelIds.length]);

  return (
    <>
      {composeOpen && <ComposeModal onClose={closeCompose} />}
      {totalCount > 0 && !relayConnected && (
        <div className="absolute top-0 left-0 right-0 z-30 h-9 bg-danger/20 border-b border-danger/30 flex items-center justify-center">
          <span className="text-danger text-[12px] font-medium">
            Unable to connect to relays. Check your network connection.
          </span>
          <button
            onClick={() => useRelaysStore.getState().connect()}
            className="ml-3 text-[11px] font-semibold text-white bg-danger/40 px-2.5 py-0.5 rounded cursor-pointer hover:bg-danger/60 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      <div className="flex-1 grid grid-cols-[248px_448px_1fr] divide-x divide-border">
      {/* Sidebar */}
      <div className="bg-sidebar flex flex-col p-4 gap-1 overflow-y-auto">
        <div className="mb-5">
          <h1 className="text-text-near-white text-[21px] font-semibold">N Mail</h1>
          <p className="text-text-secondary text-[11px]">Private messaging for Nostr</p>
        </div>

        <a
          href="/mail/inbox?compose=true"
          className="w-full h-12 bg-brand rounded-pill flex items-center gap-2 justify-center no-underline hover:brightness-110 active:scale-[0.97] transition-all duration-150"
        >
          <span className="text-white text-[15px]">＋</span>
          <span className="text-white text-[13px] font-semibold">Compose</span>
        </a>

        <nav className="flex flex-col gap-0.5 mt-6">
          {[
            { icon: "▣", label: "Inbox", count: null, href: "/mail/inbox" },
            { icon: "☆", label: "Starred", count: null, href: "/mail/starred" },
            { icon: "◷", label: "Snoozed", count: null, href: "/mail/snoozed" },
            { icon: "➤", label: "Sent", count: null, href: "/mail/sent" },
            { icon: "▤", label: "Drafts", count: null, href: "/mail/drafts" },
            { icon: "⌁", label: "Archive", count: null, href: "/mail/archive" },
            { icon: "!", label: "Spam", count: null, href: "/mail/spam" },
          ].map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 h-[38px] px-3 rounded-[10px] no-underline transition-all duration-150 ${
                  isActive
                    ? "bg-surface-active text-white"
                    : "text-text-secondary hover:text-text-near-white hover:brightness-110"
                }`}
              >
                <span className="text-[15px]">{item.icon}</span>
                <span className={`flex-1 text-[13px] ${isActive ? "font-semibold" : "font-medium"}`}>
                  {item.label}
                </span>
              </a>
            );
          })}
        </nav>

        <div className="flex items-center justify-between mt-6 mb-2 px-3">
          <p className="text-text-tertiary text-[10px] font-semibold tracking-wider">LABELS</p>
          <button
            onClick={() => setShowLabelInput(true)}
            className="text-text-tertiary text-[14px] cursor-pointer hover:text-text-secondary"
          >
            ＋
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          {labelIds.map((id) => {
            const label = labels[id];
            if (!label) return null;
            const isActive = pathname === `/mail/labels/${id}`;
            return (
              <a
                key={id}
                href={`/mail/labels/${id}`}
                className={`flex items-center gap-3 h-[30px] px-3 rounded-[10px] no-underline transition-all duration-150 ${
                  isActive
                    ? "bg-surface-active text-white"
                    : "text-text-secondary hover:text-text-near-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                <span className="text-[13px] font-medium">{label.name}</span>
              </a>
            );
          })}
          {showLabelInput && (
            <div className="flex items-center gap-2 px-3 py-1">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createLabel(); if (e.key === "Escape") setShowLabelInput(false); }}
                placeholder="Label name"
                className="flex-1 h-7 px-2 text-[12px] bg-pill-subtle border border-border rounded text-text-primary placeholder-text-placeholder outline-none"
                autoFocus
              />
              <button onClick={createLabel} className="text-ok text-[12px] font-medium cursor-pointer">Add</button>
            </div>
          )}
        </div>

        <div className="flex-1" />
        <div className="border border-border rounded-pill bg-dock p-3">
          <p className="text-[12px] font-semibold text-white">Network</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className={`w-2 h-2 rounded-full ${connectedCount > 0 ? "bg-ok" : "bg-danger"}`} />
            <span className="text-[11px] text-text-secondary">
              {connectedCount}/{totalCount} relays connected
            </span>
          </div>
          <p className="text-[10px] text-text-tertiary mt-1">Delivery health</p>
          <div className="w-full h-[3px] bg-pill-subtle rounded-progress mt-1">
            <div className="h-full bg-ok rounded-progress" style={{ width: `${healthPercent}%` }} />
          </div>
          <p className="text-[10px] text-text-tertiary mt-1">
            Synced {syncedAgo > 0 ? `${syncedAgo}s ago` : "— ago"}
          </p>
        </div>
      </div>

      {/* Message List panel */}
      <div className="bg-canvas flex flex-col overflow-hidden">
        {children}
      </div>

      {/* Reading Pane panel */}
      {selectedMessage ? (
        <ReadingPane
          message={selectedMessage}
          starred={selectedMessage.starred}
          onBack={clearSelection}
          onToggleStar={() => handleToggleStar(selectedMessage.id)}
        />
      ) : (
        <div className="bg-dock flex items-center justify-center">
          <p className="text-text-tertiary text-[13px]">Select a message to read</p>
        </div>
      )}
    </div>
    </>
  );
}
