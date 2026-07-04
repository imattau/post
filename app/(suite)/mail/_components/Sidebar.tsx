"use client";

import { useState, useCallback } from "react";
import { Inbox, Star, Clock, ArrowUpRight, FileEdit, Archive, ShieldAlert, SquarePen, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLabelsStore } from "@/lib/stores/labels";
import { toast } from "sonner";

export default function Sidebar({
  inboxUnreadCount,
  draftCount,
  connectedCount,
  totalCount,
  healthPercent,
  syncedAgo,
}: {
  inboxUnreadCount: number;
  draftCount: number;
  connectedCount: number;
  totalCount: number;
  healthPercent: number;
  syncedAgo: number;
}) {
  const pathname = usePathname();
  const labelIds = useLabelsStore((s) => s.allIds);
  const labels = useLabelsStore((s) => s.byId);

  const [showLabelInput, setShowLabelInput] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");

  const createLabel = useCallback(async () => {
    if (!newLabelName.trim()) return;
    const colors = ["#60A5FA", "#34D399", "#FBBF24", "#FB7185", "#A78BFA", "#14B8A6"];
    const color = colors[labelIds.length % colors.length];
    await useLabelsStore.getState().createLabel(newLabelName.trim(), color);
    toast.success(`Label "${newLabelName.trim()}" created`);
    setNewLabelName("");
    setShowLabelInput(false);
  }, [newLabelName, labelIds.length]);

  const navItems = [
    { icon: <Inbox size={15} />, label: "Inbox", count: inboxUnreadCount, href: "/mail/inbox" },
    { icon: <Star size={15} />, label: "Starred", count: null, href: "/mail/starred" },
    { icon: <Clock size={15} />, label: "Snoozed", count: null, href: "/mail/snoozed" },
    { icon: <ArrowUpRight size={15} />, label: "Sent", count: null, href: "/mail/sent" },
    { icon: <FileEdit size={15} />, label: "Drafts", count: draftCount, href: "/mail/drafts" },
    { icon: <Archive size={15} />, label: "Archive", count: null, href: "/mail/archive" },
    { icon: <ShieldAlert size={15} />, label: "Spam", count: null, href: "/mail/spam" },
  ] as const;

  return (
    <div className="bg-sidebar flex flex-col min-h-0 pl-6 pr-4 pt-[25px] pb-4 gap-1 overflow-y-auto">
      <div className="mb-[10px]">
        <h1 className="text-text-near-white text-[21px] font-semibold">N Mail</h1>
        <p className="text-text-secondary text-[11px] mt-[5px]">Private messaging for Nostr</p>
      </div>

      <a
        href="/mail/inbox?compose=true"
        className="w-[200px] h-12 bg-brand rounded-pill flex items-center gap-[15px] pl-4 no-underline hover:brightness-110 active:scale-[0.97] transition-all duration-150"
      >
        <SquarePen size={21} className="text-white" />
        <span className="text-white text-[14px] font-semibold">Compose</span>
      </a>

      <nav className="flex flex-col gap-[6px] mt-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.label}
              href={item.href}
              className={`-ml-2 flex h-[38px] w-[216px] items-center gap-3 rounded-[10px] pl-4 pr-3 no-underline transition-all duration-150 ${
                isActive
                  ? "bg-surface-active text-white"
                  : "text-text-secondary hover:text-text-near-white hover:brightness-110"
              }`}
            >
              <span className={isActive ? "text-brand-light" : "text-text-secondary"}>{item.icon}</span>
              <span className={`flex-1 text-[13px] ${isActive ? "font-semibold text-white" : "font-medium text-text-secondary"}`}>
                {item.label}
              </span>
              {item.count != null && (
                <span className="text-brand-light text-[12px] font-semibold">{item.count}</span>
              )}
            </a>
          );
        })}
      </nav>

      <div className="flex items-center justify-between mt-[30px] mb-2">
        <p className="text-text-tertiary text-[10px] font-semibold tracking-wider">LABELS</p>
        <button
          onClick={() => setShowLabelInput(true)}
          className="text-text-tertiary cursor-pointer hover:text-text-secondary hover:brightness-110 transition-all duration-150"
        >
          <Plus size={14} />
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
              <span className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
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
      <div className="-ml-2 mb-6 h-[142px] w-[216px] border border-border rounded-pill bg-dock p-4">
        <p className="text-[12px] font-semibold text-white">Network</p>
        <div className="flex items-center gap-1.5 mt-1">
          <div className={`w-2 h-2 rounded-full ${connectedCount > 0 ? "bg-ok" : "bg-danger"}`} />
          <span className="text-[12px] text-text-secondary">
            {connectedCount}/{totalCount} relays connected
          </span>
        </div>
        <p className="text-[11px] text-text-tertiary mt-1">Delivery health</p>
        <div className="w-[184px] h-[6px] bg-pill-subtle rounded-progress mt-1">
          <div className="h-full bg-ok rounded-progress" style={{ width: `${healthPercent}%` }} />
        </div>
        <p className="text-[10px] text-text-tertiary mt-1">
          Synced {syncedAgo > 0 ? `${syncedAgo}s ago` : "— ago"}
        </p>
      </div>
    </div>
  );
}
