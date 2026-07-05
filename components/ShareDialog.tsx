"use client";

import { useCallback, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import Avatar from "./Avatar";
import { Button } from "@/components/ui/button";
import type { DriveFile } from "@/lib/types";
import { isHexPubkey } from "@/lib/utils";

function pubkeyInitials(pubkey: string): string {
  return pubkey.slice(0, 2).toUpperCase();
}

async function resolveNpubOrPubkey(input: string): Promise<string | null> {
  const trimmed = input.trim();
  if (isHexPubkey(trimmed)) return trimmed;
  if (trimmed.startsWith("npub1")) {
    try {
      const { decode } = await import("nostr-tools/nip19");
      const decoded = decode(trimmed);
      if (decoded.type === "npub") return decoded.data;
    } catch {
      return null;
    }
  }
  return null;
}

interface ShareDialogProps {
  file: DriveFile;
  onClose: () => void;
  onUpdate: (sharedWith: string[]) => Promise<void>;
}

export default function ShareDialog({ file, onClose, onUpdate }: ShareDialogProps) {
  const [sharedWith, setSharedWith] = useState<string[]>([...file.sharedWith]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addRecipient = useCallback(async () => {
    const val = input.trim();
    if (!val) return;
    const pubkey = await resolveNpubOrPubkey(val);
    if (!pubkey) {
      setError("Invalid npub or pubkey");
      return;
    }
    if (sharedWith.includes(pubkey)) {
      setError("Already added");
      return;
    }
    setError(null);
    setSharedWith((prev) => [...prev, pubkey]);
    setInput("");
  }, [input, sharedWith]);

  const removeRecipient = useCallback((initials: string) => {
    setSharedWith((prev) => prev.filter((s) => s !== initials));
  }, []);

  const handleSave = useCallback(async () => {
    await onUpdate(sharedWith);
    onClose();
  }, [sharedWith, onUpdate, onClose]);

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Backdrop className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(5, 7, 11, 0.35)" }} />
      <Dialog.Portal>
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-border bg-dock p-6 shadow-lg outline-none">
          <h3 className="text-[16px] font-semibold text-text-near-white">Share</h3>
          <p className="mt-1 text-[11px] text-text-secondary">{file.name}</p>

          <div className="mt-5 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(null); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void addRecipient();
              }}
              placeholder="Enter npub or hex pubkey..."
              className="h-9 flex-1 rounded-pill border border-border bg-sidebar px-3 text-[12px] text-text-primary outline-none placeholder:text-text-placeholder"
            />
            <Button onClick={() => void addRecipient()}>
              Add
            </Button>
          </div>
          {error && <p className="mt-2 text-[11px] text-danger">{error}</p>}

          <div className="mt-5 space-y-2">
            {sharedWith.length === 0 ? (
              <p className="text-[11px] text-text-tertiary">Not shared with anyone yet.</p>
            ) : (
              sharedWith.map((entry) => {
                const displayInitials = isHexPubkey(entry) ? pubkeyInitials(entry) : entry;
                const displayName = isHexPubkey(entry) ? `${entry.slice(0, 8)}...` : entry;
                return (
                  <div key={entry} className="flex items-center justify-between rounded-[10px] border border-border bg-sidebar px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Avatar initials={displayInitials} size={28} />
                      <span className="text-[12px] font-medium text-text-near-white">{displayName}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeRecipient(entry)}
                      className="text-danger hover:text-danger">
                      Remove
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()}>
              Save
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
