"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useMemo } from "react";
import type { MockMessage } from "@/lib/mock/threads";
import MessageRow from "@/components/MessageRow";
import EmptyState from "@/components/EmptyState";
import { useKeyboardNav } from "@/lib/useKeyboard";
import { useMessagesStore } from "@/lib/stores/messages";

function SkeletonCard() {
  return (
    <div className="flex gap-4 px-4 py-4 my-[4px] border border-border rounded-pill bg-sidebar min-h-[104px] animate-pulse">
      <div className="w-10 h-10 rounded-full bg-pill-subtle flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-24 rounded bg-pill-subtle" />
          <div className="ml-auto h-3 w-8 rounded bg-pill-subtle" />
        </div>
        <div className="h-3 w-3/4 rounded bg-pill-subtle" />
        <div className="h-3 w-1/2 rounded bg-pill-subtle" />
        <div className="flex gap-1.5 mt-1">
          <div className="h-7 w-14 rounded-pill bg-pill-subtle" />
          <div className="h-7 w-16 rounded-pill bg-pill-subtle" />
        </div>
      </div>
    </div>
  );
}

export default function MessageListView({
  messages,
  title,
  subtitle,
  loading = false,
}: {
  messages: MockMessage[];
  title: string;
  subtitle: string;
  loading?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("c");
  const effectiveSelectedId = selectedId ?? messages[0]?.id ?? null;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Primary");
  const [batchMode, setBatchMode] = useState(false);
  const [batchSelection, setBatchSelection] = useState<Set<string>>(new Set());

  const toggleBatchMode = useCallback(() => {
    setBatchMode((prev) => { if (prev) setBatchSelection(new Set()); return !prev; });
  }, []);

  const handleBatchToggle = useCallback((id: string) => {
    setBatchSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const batchActions = useMessagesStore((s) => ({
    toggleStar: s.toggleStar,
    toggleArchive: s.toggleArchive,
    deleteMessage: s.deleteMessage,
    markRead: s.markRead,
    markUnread: s.markUnread,
    toggleSpam: s.toggleSpam,
  }));

  const performBatchAction = useCallback(async (action: (id: string) => Promise<void>) => {
    for (const id of batchSelection) {
      await action(id);
    }
    setBatchSelection(new Set());
  }, [batchSelection]);

  const handleSelect = useCallback(
    (id: string) => {
      router.push(`${pathname}?c=${id}`, { scroll: false });
    },
    [router, pathname]
  );

  const filteredIds = useMemo(() => messages.map((m) => m.id), [messages]);
  useKeyboardNav(filteredIds, effectiveSelectedId, handleSelect, [filteredIds, effectiveSelectedId]);

  const filtered = useMemo(() => {
    let result = messages;

    if (activeFilter === "Unread") result = result.filter((m) => !m.read);
    else if (activeFilter === "Starred") result = result.filter((m) => m.starred);
    else if (activeFilter === "Attachments") result = result.filter((m) => m.attachments.length > 0);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.preview.toLowerCase().includes(q) ||
          m.sender.name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [messages, activeFilter, searchQuery]);

  return (
    <div className="flex flex-col h-full min-h-0" role="region" aria-label={title} suppressHydrationWarning>
      <div className="flex items-center justify-between px-6 pt-[25px] pb-0">
        <div>
          <h2 className="text-[22px] font-semibold leading-none text-text-near-white" tabIndex={-1}>{title}</h2>
          <p className="mt-[7px] text-[11px] text-text-secondary">{subtitle}</p>
        </div>
        <button
          onClick={toggleBatchMode}
          className={`h-7 px-3 rounded-pill text-[11px] font-medium border transition-all duration-150 cursor-pointer ${
            batchMode
              ? "bg-surface-active border-brand text-brand-light"
              : "bg-sidebar border-border text-text-secondary hover:border-brand/50"
          }`}
        >
          {batchMode ? "Done" : "Select"}
        </button>
      </div>

      <div className="px-6 pt-[21px]">
        <div className="flex h-[42px] w-[400px] max-w-full items-center gap-[18px] rounded-[12px] border border-border bg-sidebar px-4">
          <span className="text-[15px] text-text-secondary" aria-hidden="true">⌕</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages, people or npubs"
            aria-label="Search messages"
            className="flex-1 bg-transparent border-none outline-none text-[12px] text-text-primary placeholder-text-placeholder"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto px-6 pt-4" role="tablist" aria-label="Filter messages">
        {["Primary", "Unread", "Starred", "Attachments"].map((chip) => (
          <button
            key={chip}
            onClick={() => setActiveFilter(chip)}
            role="tab"
            aria-selected={chip === activeFilter}
              className={`h-[28px] px-3 rounded-pill text-[12px] font-medium border transition-all duration-150 cursor-pointer whitespace-nowrap ${
               chip === activeFilter
                 ? "bg-surface-active border-brand text-brand-light"
                 : "bg-sidebar border-border text-text-secondary hover:border-brand/50"
             }`}
          >
            {chip}
          </button>
        ))}
        <button
          disabled
          className="text-text-tertiary text-[18px] font-semibold ml-1 cursor-not-allowed opacity-50"
          aria-label="No more filters available"
        >
          ⋮
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-4 pb-2 relative" role="list" aria-label="Message list">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : messages.length === 0 ? (
          <EmptyState icon="▣" title="No messages yet" description="Start by composing a new message." />
        ) : filtered.length === 0 && searchQuery ? (
          <EmptyState icon="⌕" title="No results" description="No messages match your search." />
        ) : filtered.length === 0 ? (
          <EmptyState title={`No ${title.toLowerCase()} messages`} />
        ) : (
          filtered.map((msg) => (
            <MessageRow
              key={msg.id}
              message={msg}
              selected={effectiveSelectedId === msg.id}
              onClick={() => handleSelect(msg.id)}
              batchMode={batchMode}
              batchSelected={batchSelection.has(msg.id)}
              onBatchToggle={() => handleBatchToggle(msg.id)}
            />
          ))
        )}
        {batchSelection.size > 0 && (
          <div className="sticky bottom-0 left-0 right-0 flex items-center gap-2 px-4 py-3 bg-dock border-t border-border">
            <span className="text-[12px] text-text-secondary mr-2">{batchSelection.size} selected</span>
            <button
              onClick={() => performBatchAction(batchActions.toggleArchive)}
              className="h-8 px-3 rounded-[10px] border border-border bg-sidebar text-[11px] font-medium text-text-secondary hover:border-brand/50 cursor-pointer transition-all duration-150"
            >
              Archive
            </button>
            <button
              onClick={() => performBatchAction(batchActions.toggleStar)}
              className="h-8 px-3 rounded-[10px] border border-border bg-sidebar text-[11px] font-medium text-text-secondary hover:border-brand/50 cursor-pointer transition-all duration-150"
            >
              Star
            </button>
            <button
              onClick={() => performBatchAction(batchActions.markRead)}
              className="h-8 px-3 rounded-[10px] border border-border bg-sidebar text-[11px] font-medium text-text-secondary hover:border-brand/50 cursor-pointer transition-all duration-150"
            >
              Read
            </button>
            <button
              onClick={() => performBatchAction(batchActions.markUnread)}
              className="h-8 px-3 rounded-[10px] border border-border bg-sidebar text-[11px] font-medium text-text-secondary hover:border-brand/50 cursor-pointer transition-all duration-150"
            >
              Unread
            </button>
            <button
              onClick={() => performBatchAction(batchActions.deleteMessage)}
              className="h-8 px-3 rounded-[10px] border border-border bg-sidebar text-[11px] font-medium text-danger hover:border-danger/50 cursor-pointer transition-all duration-150"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
