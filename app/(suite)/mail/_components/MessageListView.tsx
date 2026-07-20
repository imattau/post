"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useMemo, useRef, useEffect } from "react";
import { useVirtualizer, measureElement } from "@tanstack/react-virtual";
import { useDebounce } from "use-debounce";
import { Search, Inbox, SearchX } from "lucide-react";
import type { MockMessage } from "@/lib/mock/threads";
import MessageRow from "@/components/MessageRow";
import ConversationRow, { type ConversationGroup } from "@/components/ConversationRow";
import EmptyState from "@/components/EmptyState";
import { useKeyboardNav } from "@/lib/useKeyboard";
import { useMessagesStore } from "@/lib/stores/messages";
import { useSettingsStore } from "@/lib/stores/settings";

type DisplayItem =
  | { type: "message"; message: MockMessage }
  | { type: "group"; group: ConversationGroup };

function groupByConversation(messages: MockMessage[]): DisplayItem[] {
  const groups = new Map<string, MockMessage[]>();
  const singles: DisplayItem[] = [];

  for (const m of messages) {
    if (m.conversationId) {
      const existing = groups.get(m.conversationId) ?? [];
      existing.push(m);
      groups.set(m.conversationId, existing);
    } else {
      singles.push({ type: "message", message: m });
    }
  }

  for (const [conversationId, msgs] of groups) {
    msgs.sort((a, b) => b.createdAt - a.createdAt);
    singles.push({ type: "group", group: { conversationId, messages: msgs } });
  }

  singles.sort((a, b) => {
    const aTime = a.type === "group" ? a.group.messages[0].createdAt : a.message.createdAt;
    const bTime = b.type === "group" ? b.group.messages[0].createdAt : b.message.createdAt;
    return bTime - aTime;
  });

  return singles;
}

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

  const batchToggleStar = useMessagesStore((s) => s.toggleStar);
  const batchToggleArchive = useMessagesStore((s) => s.toggleArchive);
  const batchToggleSpam = useMessagesStore((s) => s.toggleSpam);
  const batchDeleteMessage = useMessagesStore((s) => s.deleteMessage);
  const batchMarkRead = useMessagesStore((s) => s.markRead);
  const batchMarkUnread = useMessagesStore((s) => s.markUnread);

  const batchSelectionRef = useRef(batchSelection);
  batchSelectionRef.current = batchSelection;

  const performBatchAction = useCallback(async (action: (id: string) => Promise<void>) => {
    for (const id of batchSelectionRef.current) {
      await action(id);
    }
    setBatchSelection(new Set());
  }, []);

  const listRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 200);

  const filtered = useMemo(() => {
    let result = messages;

    if (activeFilter === "Unread") result = result.filter((m) => !m.read);
    else if (activeFilter === "Starred") result = result.filter((m) => m.starred);
    else if (activeFilter === "Attachments") result = result.filter((m) => m.attachments.length > 0);

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.preview.toLowerCase().includes(q) ||
          m.sender.name.toLowerCase().includes(q) ||
          (m.sender.npub && m.sender.npub.toLowerCase().includes(q))
      );
    }
    return result;
  }, [messages, activeFilter, debouncedQuery]);

  const conversationView = useSettingsStore((s) => (s.values["conversation-view"] ?? false) as boolean);

  const handleSelect = useCallback(
    (id: string) => {
      router.push(`${pathname}?c=${id}`, { scroll: false });
    },
    [router, pathname]
  );

  const displayItems = useMemo<DisplayItem[]>(() => {
    if (!conversationView) return filtered.map((m) => ({ type: "message" as const, message: m }));
    return groupByConversation(filtered);
  }, [filtered, conversationView]);

  const navIds = useMemo(() => displayItems.map((item) => {
    if (item.type === "group") return item.group.messages[0].id;
    return item.message.id;
  }), [displayItems]);
  useKeyboardNav(navIds, effectiveSelectedId, handleSelect, [navIds, effectiveSelectedId]);

  const virtualizer = useVirtualizer({
    count: displayItems.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 112,
    measureElement,
    overscan: 5,
  });

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
          <Search size={15} className="text-text-secondary" aria-hidden="true" />
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

      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-3 pt-4 pb-2 relative" role="list" aria-label="Message list">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : displayItems.length > 0 ? (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = displayItems[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  ref={virtualizer.measureElement}
                  data-index={virtualItem.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {item.type === "group" ? (
                    <ConversationRow
                      group={item.group}
                      selected={effectiveSelectedId === item.group.messages[0].id}
                      onClick={() => handleSelect(item.group.messages[0].id)}
                    />
                  ) : (
                    <MessageRow
                      message={item.message}
                      selected={effectiveSelectedId === item.message.id}
                      onClick={() => handleSelect(item.message.id)}
                      batchMode={batchMode}
                      batchSelected={batchSelection.has(item.message.id)}
                      onBatchToggle={() => handleBatchToggle(item.message.id)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState icon={<Inbox size={32} />} title="No messages yet" description="Start by composing a new message." />
        ) : searchQuery ? (
          <EmptyState icon={<SearchX size={32} />} title="No results" description="No messages match your search." />
        ) : (
          <EmptyState title={`No ${title.toLowerCase()} messages`} />
        )}
        {batchSelection.size > 0 && (
          <div className="sticky bottom-0 left-0 right-0 flex items-center gap-2 px-4 py-3 bg-dock border-t border-border">
            <span className="text-[12px] text-text-secondary mr-2">{batchSelection.size} selected</span>
            <button
              onClick={() => performBatchAction(batchToggleArchive)}
              className="h-8 px-3 rounded-[10px] border border-border bg-sidebar text-[11px] font-medium text-text-secondary hover:border-brand/50 cursor-pointer transition-all duration-150"
            >
              Archive
            </button>
            <button
              onClick={() => performBatchAction(batchToggleStar)}
              className="h-8 px-3 rounded-[10px] border border-border bg-sidebar text-[11px] font-medium text-text-secondary hover:border-brand/50 cursor-pointer transition-all duration-150"
            >
              Star
            </button>
            <button
              onClick={() => performBatchAction(batchToggleSpam)}
              className="h-8 px-3 rounded-[10px] border border-border bg-sidebar text-[11px] font-medium text-text-secondary hover:border-brand/50 cursor-pointer transition-all duration-150"
            >
              Spam
            </button>
            <button
              onClick={() => performBatchAction(batchMarkRead)}
              className="h-8 px-3 rounded-[10px] border border-border bg-sidebar text-[11px] font-medium text-text-secondary hover:border-brand/50 cursor-pointer transition-all duration-150"
            >
              Read
            </button>
            <button
              onClick={() => performBatchAction(batchMarkUnread)}
              className="h-8 px-3 rounded-[10px] border border-border bg-sidebar text-[11px] font-medium text-text-secondary hover:border-brand/50 cursor-pointer transition-all duration-150"
            >
              Unread
            </button>
            <button
              onClick={() => performBatchAction(batchDeleteMessage)}
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
