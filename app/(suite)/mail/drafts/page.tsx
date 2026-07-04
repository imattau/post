"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileEdit } from "lucide-react";
import type { Draft } from "@/lib/types";
import type { MockMessage } from "@/lib/mock/threads";
import MessageRow from "@/components/MessageRow";
import EmptyState from "@/components/EmptyState";
import { useComposeStore } from "@/lib/stores/compose";

function draftToMessage(draft: Draft): MockMessage {
  const firstRecipient = draft.to[0];
  return {
    id: draft.id,
    sender: {
      id: firstRecipient?.pubkey ?? "draft",
      name: firstRecipient?.name ?? "No recipient",
      npub: firstRecipient?.npub ?? "",
      avatarInitials: (firstRecipient?.name ?? "DR").slice(0, 2).toUpperCase(),
      verified: false,
    },
    recipientName: firstRecipient?.name ?? "No recipient",
    subject: draft.subject || "(no subject)",
    preview: draft.body || "Draft message",
    body: draft.body,
    createdAt: draft.updatedAt,
    read: true,
    starred: false,
    labels: [],
    attachments: draft.attachments
      .filter((upload) => upload.result)
      .map((upload) => upload.result!),
    encrypted: true,
    relayCount: draft.relayOverrides.length || 3,
    threadLength: 1,
  };
}

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const openSavedDraft = useComposeStore((s) => s.openSavedDraft);

  useEffect(() => {
    let active = true;
    useComposeStore.getState().listDrafts().then((rows) => {
      if (active) setDrafts(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  const messages = useMemo(() => drafts.map(draftToMessage), [drafts]);

  return (
    <div className="flex flex-col h-full min-h-0" role="region" aria-label="Drafts">
      <div className="flex items-center justify-between px-6 pt-[25px] pb-0">
        <div>
          <h2 className="text-[22px] font-semibold leading-none text-text-near-white">Drafts</h2>
          <p className="mt-[7px] text-[11px] text-text-secondary">{drafts.length} draft messages</p>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-4 pb-2" role="list" aria-label="Draft list">
        {messages.length === 0 ? (
          <EmptyState icon={<FileEdit size={32} />} title="No drafts" description="Saved drafts will appear here." />
        ) : (
          messages.map((msg) => (
            <MessageRow
              key={msg.id}
              message={msg}
              selected={false}
              onClick={() => {
                void openSavedDraft(msg.id);
                router.push("/mail/drafts?compose=true", { scroll: false });
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
