"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { MESSAGES } from "@/lib/mock/threads";
import { useRelaysStore } from "@/lib/stores/relays";
import ReadingPane from "@/components/ReadingPane";
import ComposeModal from "@/components/ComposeModal";

export default function MailContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = searchParams.get("c") || "msg-1";
  const composeOpen = searchParams.get("compose") === "true";

  const selectedMessage = MESSAGES.find((m) => m.id === selectedId) ?? MESSAGES[0];

  const [starredIds, setStarredIds] = useState<Set<string>>(new Set(["msg-1"]));

  const clearSelection = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const toggleStar = useCallback((id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const closeCompose = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const relayStatuses = useRelaysStore((s) => s.statuses);
  const healthPercent = useRelaysStore((s) => s.healthPercent);
  const syncedAgo = useRelaysStore((s) => s.syncedAgo);
  const connectedCount = Object.values(relayStatuses).filter((s) => s.connected).length;
  const totalCount = Object.keys(relayStatuses).length;

  return (
    <>
      {composeOpen && <ComposeModal onClose={closeCompose} />}
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
            { icon: "▣", label: "Inbox", count: 12, href: "/mail/inbox" },
            { icon: "☆", label: "Starred", count: null, href: "/mail/starred" },
            { icon: "◷", label: "Snoozed", count: null, href: "/mail/snoozed" },
            { icon: "➤", label: "Sent", count: null, href: "/mail/sent" },
            { icon: "▤", label: "Drafts", count: 2, href: "/mail/drafts" },
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
                {item.count !== null && (
                  <span className={`text-[13px] ${isActive ? "text-brand-light" : "text-text-secondary"}`}>
                    {item.count}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        <p className="text-text-tertiary text-[10px] font-semibold tracking-wider mt-6 mb-2 px-3">LABELS</p>

        <div className="flex flex-col gap-0.5">
          {[
            { name: "Work", color: "var(--color-info)" },
            { name: "Friends", color: "var(--color-ok)" },
            { name: "Projects", color: "var(--color-warn)" },
            { name: "Receipts", color: "var(--color-danger)" },
          ].map((label) => (
            <div
              key={label.name}
              className="flex items-center gap-3 h-[30px] px-3 text-text-secondary hover:text-text-near-white cursor-pointer rounded-[10px] transition-all duration-150"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
              <span className="text-[13px] font-medium">{label.name}</span>
            </div>
          ))}
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
          starred={starredIds.has(selectedMessage.id)}
          onBack={clearSelection}
          onToggleStar={() => toggleStar(selectedMessage.id)}
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
