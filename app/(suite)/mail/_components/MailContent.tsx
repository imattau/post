"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import { useComposeStore } from "@/lib/stores/compose";
import { useRelaysStore } from "@/lib/stores/relays";
import { useMessagesStore } from "@/lib/stores/messages";
import { useMailboxStore } from "@/lib/stores/mailboxes";
import { useSettingsStore } from "@/lib/stores/settings";
import { useMailboxMessages } from "../_components/useMailboxMessages";
import { getThreadMessages } from "@/lib/thread";
import Sidebar from "./Sidebar";
import RelayBanner from "./RelayBanner";
import ReadingPane from "@/components/ReadingPane";
const ComposeModal = dynamic(() => import("@/components/ComposeModal"), {
  ssr: false,
  loading: () => null,
});

export default function MailContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = searchParams.get("c");
  const composeOpen = searchParams.get("compose") === "true";
  const mailboxFromPath = pathname.split("/")[2] || "inbox";
  const currentMailbox = ["inbox","starred","snoozed","sent","drafts","archive","spam"].includes(mailboxFromPath) ? mailboxFromPath : "inbox";

  const { unreadCount: inboxUnreadCount } = useMailboxMessages("inbox");
  const { messages: currentMessages } = useMailboxMessages(currentMailbox);
  const { messages: allMessages } = useMailboxMessages("all");
  const selectedMessage = selectedId
    ? currentMessages.find((m) => m.id === selectedId) ?? allMessages.find((m) => m.id === selectedId) ?? null
    : currentMessages[0] ?? null;

  const messagesById = useMessagesStore((s) => s.byId);
  const threadMessages = useMemo(
    () => (selectedMessage ? getThreadMessages(selectedMessage.id, messagesById) : []),
    [selectedMessage, messagesById]
  );

  const draftCount = useMailboxStore((s) => s.unreadCounts.drafts);
  const startSnoozeWatcher = useMessagesStore((s) => s.startSnoozeWatcher);
  const markRead = useMessagesStore((s) => s.markRead);
  const markUnread = useMessagesStore((s) => s.markUnread);
  const toggleStar = useMessagesStore((s) => s.toggleStar);
  const toggleArchive = useMessagesStore((s) => s.toggleArchive);
  const toggleSpam = useMessagesStore((s) => s.toggleSpam);
  const snooze = useMessagesStore((s) => s.snooze);
  const deleteMessage = useMessagesStore((s) => s.deleteMessage);

  const refreshUnreadCounts = useMailboxStore((s) => s.refreshUnreadCounts);
  const updateStatuses = useRelaysStore((s) => s.updateStatuses);
  const relayStatuses = useRelaysStore((s) => s.statuses);
  const healthPercent = useRelaysStore((s) => s.healthPercent);
  const syncedAgo = useRelaysStore((s) => s.syncedAgo);
  const connectedCount = Object.values(relayStatuses).filter((s) => s.connected).length;
  const totalCount = Object.keys(relayStatuses).length;

  const clearSelection = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const handleToggleStar = useCallback((id: string) => toggleStar(id), [toggleStar]);

  const handleArchive = useCallback(async (id: string) => {
    await toggleArchive(id);
    clearSelection();
  }, [toggleArchive, clearSelection]);

  const handleSnooze = useCallback(async (id: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    await snooze(id, tomorrow.getTime());
    clearSelection();
  }, [snooze, clearSelection]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteMessage(id);
    clearSelection();
  }, [deleteMessage, clearSelection]);

  const handleToggleRead = useCallback(async (id: string, read: boolean) => {
    if (read) await markUnread(id);
    else await markRead(id);
  }, [markRead, markUnread]);

  const handleToggleSpam = useCallback(async (id: string) => {
    await toggleSpam(id);
    clearSelection();
  }, [toggleSpam, clearSelection]);

  const handleCopyEventId = useCallback(async (id: string) => {
    await navigator.clipboard?.writeText(id);
  }, []);

  const handleThreadSelect = useCallback(
    (id: string) => router.push(`${pathname}?c=${id}`, { scroll: false }),
    [router, pathname]
  );

  const closeCompose = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedMessage && !composeOpen) clearSelection();
      if (e.key === "n" && !composeOpen && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        router.push(`${pathname}?compose=true`, { scroll: false });
      }
      if (e.key === "u" && selectedMessage && !composeOpen) {
        handleToggleRead(selectedMessage.id, selectedMessage.read);
      }
      if (e.key === "#" && selectedMessage && !composeOpen) {
        handleDelete(selectedMessage.id);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedMessage, composeOpen, clearSelection, router, pathname, handleToggleRead, handleDelete]);

  const markReadOnScroll = useSettingsStore((s) => (s.values["mark-read-scroll"] ?? true) as boolean);

  useEffect(() => {
    if (selectedMessage && !selectedMessage.read && markReadOnScroll) {
      markRead(selectedMessage.id);
    }
  }, [selectedMessage, markRead, markReadOnScroll]);

  useEffect(() => {
    const cleanup = startSnoozeWatcher();
    return cleanup;
  }, [startSnoozeWatcher]);

  useEffect(() => {
    const interval = setInterval(() => void updateStatuses(), 30_000);
    return () => clearInterval(interval);
  }, [updateStatuses]);

  const messageCount = useMessagesStore((s) => s.ids.length);
  useEffect(() => {
    refreshUnreadCounts();
  }, [messageCount, refreshUnreadCounts]);

  useLayoutEffect(() => {
    if (composeOpen) {
      useComposeStore.getState().open();
    }
  }, [composeOpen]);

  return (
    <>
      {composeOpen && <ComposeModal onClose={closeCompose} />}
      <RelayBanner />
      <div className="flex-1 min-h-0 grid grid-cols-[248px_448px_1fr] divide-x divide-border">
        <Sidebar
          inboxUnreadCount={inboxUnreadCount}
          draftCount={draftCount}
          connectedCount={connectedCount}
          totalCount={totalCount}
          healthPercent={healthPercent}
          syncedAgo={syncedAgo}
        />

        <div className="bg-canvas flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>

        {selectedMessage ? (
          <ReadingPane
            message={selectedMessage}
            starred={selectedMessage.starred}
            spam={messagesById[selectedMessage.id]?.spam ?? currentMailbox === "spam"}
            onBack={clearSelection}
            onToggleStar={() => handleToggleStar(selectedMessage.id)}
            onArchive={() => handleArchive(selectedMessage.id)}
            onSnooze={() => handleSnooze(selectedMessage.id)}
            onDelete={() => handleDelete(selectedMessage.id)}
            onToggleRead={() => handleToggleRead(selectedMessage.id, selectedMessage.read)}
            onToggleSpam={() => handleToggleSpam(selectedMessage.id)}
            onCopyEventId={() => handleCopyEventId(selectedMessage.id)}
            threadMessages={threadMessages}
            onThreadSelect={handleThreadSelect}
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
