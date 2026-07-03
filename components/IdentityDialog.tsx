"use client";

import { useState, useCallback } from "react";
import { useIdentityStore } from "@/lib/stores/identity";

export default function IdentityDialog({ onClose }: { onClose: () => void }) {
  const identity = useIdentityStore((s) => s.identity);
  const usingNip07 = useIdentityStore((s) => s.usingNip07);
  const logout = useIdentityStore((s) => s.logout);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!identity?.nsec) return;
    try {
      await navigator.clipboard.writeText(identity.nsec);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }, [identity]);

  const handleExport = useCallback(() => {
    if (!identity?.nsec) return;
    const blob = new Blob([identity.nsec], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nostr-nsec-backup.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [identity]);

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(5,7,11,0.44)" }} onClick={onClose} />
      <div className="fixed z-50" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
        <div className="w-[400px] rounded-[20px] bg-modal-card border border-modal-stroke shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-modal-stroke">
            <span className="text-[16px] font-semibold text-text-modal">Identity</span>
            <button onClick={onClose} className="text-text-modal-2 text-[18px] cursor-pointer hover:text-text-modal">×</button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <p className="text-[11px] font-medium text-text-tertiary mb-1">Public Key (npub)</p>
              <p className="text-[13px] text-text-modal break-all bg-pill-subtle p-2 rounded">{identity?.npub}</p>
            </div>

            {identity?.nip05 && (
              <div>
                <p className="text-[11px] font-medium text-text-tertiary mb-1">NIP-05</p>
                <p className="text-[13px] text-text-modal">{identity.nip05}</p>
              </div>
            )}

            <div>
              <p className="text-[11px] font-medium text-text-tertiary mb-1">Auth Method</p>
              <p className="text-[13px] text-text-modal">
                {usingNip07 ? "NIP-07 Browser Extension" : "Local Key Store"}
              </p>
            </div>

            {identity?.nsec && !usingNip07 && (
              <div>
                <p className="text-[11px] font-medium text-text-tertiary mb-1">Private Key (nsec)</p>
                <div className="flex gap-2">
                  <p className="flex-1 text-[13px] text-text-modal break-all bg-pill-subtle p-2 rounded font-mono">
                    {identity.nsec.slice(0, 16)}…{identity.nsec.slice(-4)}
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 h-8 rounded bg-brand text-white text-[11px] font-semibold cursor-pointer hover:brightness-110 transition-all"
                  >
                    {copied ? "Copied!" : "Copy nsec"}
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex-1 h-8 rounded bg-modal-2 border border-modal-stroke text-text-modal-2 text-[11px] font-medium cursor-pointer hover:brightness-110 transition-all"
                  >
                    Download backup
                  </button>
                </div>
              </div>
            )}

            {usingNip07 && (
              <p className="text-[12px] text-text-tertiary">
                Your nsec is managed by the browser extension. Post never has direct access to it.
              </p>
            )}
          </div>

          <div className="px-5 py-3 border-t border-modal-stroke flex justify-between">
            <button
              onClick={() => { logout(); onClose(); }}
              className="text-[11px] font-medium text-danger cursor-pointer hover:brightness-110 transition-all"
            >
              Disconnect
            </button>
            <button
              onClick={onClose}
              className="h-8 px-4 rounded bg-brand text-white text-[11px] font-semibold cursor-pointer hover:brightness-110 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
