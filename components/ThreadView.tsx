"use client";

import { memo } from "react";
import type { Message, Profile } from "@post/nostr-core";
import { useProfilesStore } from "@/lib/stores/profiles";
import RelativeTime from "./RelativeTime";

function senderName(pubkey: string, profiles: Record<string, Profile>): string {
  const profile = profiles[pubkey];
  if (profile?.name) return profile.name;
  if (profile?.displayName) return profile.displayName;
  return `${pubkey.slice(0, 12)}…`;
}

function senderInitials(pubkey: string, profiles: Record<string, Profile>): string {
  const profile = profiles[pubkey];
  if (profile?.name) return profile.name.slice(0, 2).toUpperCase();
  if (profile?.displayName) return profile.displayName.slice(0, 2).toUpperCase();
  return pubkey.slice(0, 2).toUpperCase();
}

const ThreadView = memo(function ThreadView({
  messages,
  onSelect,
}: {
  messages: Message[];
  onSelect: (id: string) => void;
}) {
  const profiles = useProfilesStore((s) => s.byPubkey);

  if (messages.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-semibold text-text-tertiary tracking-wider">THREAD</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-2">
        {messages.map((msg) => (
          <button
            key={msg.id}
            onClick={() => onSelect(msg.id)}
            className="w-full text-left flex gap-3 px-4 py-3 rounded-[10px] border border-border bg-sidebar hover:bg-sidebar/80 transition-all duration-150 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-pill-subtle flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-semibold text-text-secondary">
                {senderInitials(msg.pubkey, profiles)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-text-primary truncate">
                  {senderName(msg.pubkey, profiles)}
                </span>
                <span className="ml-auto text-[10px] text-text-tertiary flex-shrink-0">
                  <RelativeTime ts={msg.createdAt} />
                </span>
              </div>
              {msg.subject && (
                <p className="text-[11px] font-medium text-text-near-white truncate mt-0.5">
                  {msg.subject}
                </p>
              )}
              <p className="text-[11px] text-text-tertiary truncate mt-0.5">
                {msg.preview || msg.content.slice(0, 120)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

export default ThreadView;
