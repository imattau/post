"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import type { DriveFile } from "@/lib/types";

interface ShareDialogProps {
  file: DriveFile;
  onClose: () => void;
  onUpdate: (sharedWith: string[]) => Promise<void>;
}

export default function ShareDialog({ file, onClose, onUpdate }: ShareDialogProps) {
  const [sharedWith, setSharedWith] = useState<string[]>([...file.sharedWith]);
  const [input, setInput] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const addRecipient = useCallback(() => {
    const val = input.trim().toUpperCase();
    if (!val || sharedWith.includes(val)) return;
    setSharedWith((prev) => [...prev, val]);
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
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(5, 7, 11, 0.35)" }} onClick={onClose} />
      <div
        ref={ref}
        className="fixed left-1/2 top-1/2 z-50 w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-border bg-dock p-6 shadow-lg"
      >
        <h3 className="text-[16px] font-semibold text-text-near-white">Share</h3>
        <p className="mt-1 text-[11px] text-text-secondary">{file.name}</p>

        <div className="mt-5 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addRecipient();
              if (e.key === "Escape") onClose();
            }}
            placeholder="Enter initials or npub..."
            className="h-9 flex-1 rounded-pill border border-border bg-sidebar px-3 text-[12px] text-text-primary outline-none placeholder:text-text-placeholder"
          />
          <button
            onClick={addRecipient}
            className="h-9 rounded-pill bg-brand px-4 text-[12px] font-medium text-white"
          >
            Add
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {sharedWith.length === 0 ? (
            <p className="text-[11px] text-text-tertiary">Not shared with anyone yet.</p>
          ) : (
            sharedWith.map((initials) => (
              <div key={initials} className="flex items-center justify-between rounded-[10px] border border-border bg-sidebar px-3 py-2">
                <div className="flex items-center gap-3">
                  <Avatar initials={initials} size={28} />
                  <span className="text-[12px] font-medium text-text-near-white">{initials}</span>
                </div>
                <button
                  onClick={() => removeRecipient(initials)}
                  className="text-[11px] font-medium text-danger"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 rounded-pill border border-border px-4 text-[12px] font-medium text-text-secondary">
            Cancel
          </button>
          <button onClick={() => void handleSave()} className="h-9 rounded-pill bg-brand px-4 text-[12px] font-medium text-white">
            Save
          </button>
        </div>
      </div>
    </>
  );
}
