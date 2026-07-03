"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useMemo } from "react";
import type { MockMessage } from "@/lib/mock/threads";
import MessageRow from "@/components/MessageRow";

export default function MessageListView({
  messages,
  title,
  subtitle,
}: {
  messages: MockMessage[];
  title: string;
  subtitle: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("c");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Primary");

  const handleSelect = useCallback(
    (id: string) => {
      router.push(`${pathname}?c=${id}`, { scroll: false });
    },
    [router, pathname]
  );

  const filtered = useMemo(() => {
    let result = messages;

    if (activeFilter === "Unread") {
      result = result.filter((m) => !m.read);
    } else if (activeFilter === "Starred") {
      result = result.filter((m) => m.starred);
    }

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
    <>
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          <h2 className="text-[22px] font-semibold text-white">{title}</h2>
          <p className="text-text-secondary text-[11px]">{subtitle}</p>
        </div>
      </div>

      <div className="px-5 py-2">
        <div className="flex items-center gap-2 h-[42px] px-3 bg-sidebar border border-border rounded-pill">
          <span className="text-text-tertiary text-[15px]">⌕</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages, people or npubs"
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder-text-placeholder"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 px-5 py-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {["Primary", "Unread", "Starred", "Attachments"].map((chip) => (
          <button
            key={chip}
            onClick={() => setActiveFilter(chip)}
            className={`h-[30px] px-3 rounded-pill text-[12px] font-medium border transition-all duration-150 cursor-pointer whitespace-nowrap ${
              chip === activeFilter
                ? "bg-surface-active border-brand text-brand-light"
                : "bg-sidebar border-border text-text-secondary hover:border-brand/50"
            }`}
          >
            {chip}
          </button>
        ))}
        <button className="text-text-secondary text-[18px] font-semibold ml-1 cursor-pointer">⋮</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-tertiary text-[13px]">No messages yet</p>
          </div>
        ) : (
          filtered.map((msg) => (
            <MessageRow
              key={msg.id}
              message={msg}
              selected={selectedId === msg.id}
              onClick={() => handleSelect(msg.id)}
            />
          ))
        )}
      </div>
    </>
  );
}
