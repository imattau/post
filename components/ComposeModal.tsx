"use client";

import { useRef, useState, useCallback } from "react";
import { useBlossomStore } from "@/lib/stores/blossom";
import { useComposeStore } from "@/lib/stores/compose";

interface UploadItem {
  id: string;
  fileName: string;
  sizeBytes: number;
  progress: number;
  status: "pending" | "uploading" | "uploaded" | "failed";
  error: string | null;
}

export default function ComposeModal({ onClose }: { onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const uploadFile = useBlossomStore((s) => s.uploadFile);

  const handleAttach = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const { createKeyStore } = await import("@post/nostr-core");
    const keyStore = createKeyStore();
    const identity = keyStore.load();
    if (!identity?.nsec) return;

    const { decode } = await import("nostr-tools/nip19");
    const nsecDecoded = decode(identity.nsec);
    if (nsecDecoded.type !== "nsec") return;
    const sk = nsecDecoded.data;

    for (const file of files) {
      const id = crypto.randomUUID();
      setUploads((prev) => [
        ...prev,
        { id, fileName: file.name, sizeBytes: file.size, progress: 0, status: "pending", error: null },
      ]);

      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "uploading" as const } : u))
      );

      try {
        await uploadFile(file, sk, (pct) => {
          setUploads((prev) =>
            prev.map((u) => (u.id === id ? { ...u, progress: pct } : u))
          );
        });
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: "uploaded" as const, progress: 100 } : u))
        );
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id
              ? { ...u, status: "failed" as const, error: err instanceof Error ? err.message : "Upload failed" }
              : u
          )
        );
      }
    }

    if (e.target) e.target.value = "";
  }, [uploadFile]);

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  function formatSize(bytes: number): string {
    if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`;
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{ backgroundColor: "rgba(5,7,11,0.44)" }}
        onClick={onClose}
      />
      <div
        className="fixed z-50 animate-[composeOpen_250ms_ease-out]"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 730,
          height: 784,
        }}
      >
        <div
          className="w-full h-full rounded-[24px]"
          style={{ boxShadow: "0 20px 40px 0 rgba(0,0,0,0.5)" }}
        >
          <div className="w-full h-full rounded-[20px] bg-modal-card border border-modal-stroke flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-modal-stroke">
              <div className="flex items-center gap-3">
                <span className="text-[16px] font-semibold text-text-modal">New message</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="w-[30px] h-[30px] rounded-[8px] bg-modal-2 border border-modal-stroke flex items-center justify-center cursor-pointer hover:brightness-110 transition-all duration-150"
                >
                  <span className="text-text-modal-2 text-[15px]">–</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-[30px] h-[30px] rounded-[8px] bg-modal-2 border border-modal-stroke flex items-center justify-center cursor-pointer hover:brightness-110 transition-all duration-150"
                >
                  <span className="text-text-modal-2 text-[15px]">×</span>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 px-5 py-3 border-b border-modal-stroke">
              <span className="text-[12px] font-medium text-text-modal-2 pt-1">To</span>
              <div className="flex-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[13px] text-text-placeholder">Add people, npubs or groups</span>
              </div>
              <div className="flex gap-1">
                <button className="text-[11px] font-medium text-brand-light cursor-pointer hover:brightness-110">Cc</button>
                <span className="text-[11px] text-text-modal-2"> </span>
                <button className="text-[11px] font-medium text-brand-light cursor-pointer hover:brightness-110">Bcc</button>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 border-b border-modal-stroke">
              <span className="text-[12px] font-medium text-text-modal-2">Subject</span>
              <span className="text-[13px] text-text-placeholder">Add a subject…</span>
            </div>

            <div className="flex-1 p-5">
              <p className="text-[14px] text-text-placeholder">Write your message…</p>
            </div>

            {uploads.length > 0 && (
              <div className="px-5 pb-2 flex flex-col gap-2">
                {uploads.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 h-[74px] px-3 border border-modal-stroke rounded-pill bg-modal-attach"
                  >
                    <div className="w-12 h-14 rounded-[8px] bg-pill-subtle flex items-center justify-center flex-shrink-0">
                      <span className="text-text-tertiary text-[11px] font-bold">▣</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-text-modal truncate">{u.fileName}</p>
                      <p className="text-[10px] text-text-tertiary mt-0.5">
                        {formatSize(u.sizeBytes)}
                        {u.status === "uploading" && ` · Uploading ${u.progress}%`}
                        {u.status === "uploaded" && ` · Encrypted · Stored in Drive`}
                        {u.status === "failed" && ` · Failed: ${u.error}`}
                      </p>
                      {u.status === "uploading" && (
                        <div className="w-full h-[3px] bg-pill-subtle rounded-progress mt-1">
                          <div
                            className="h-full bg-ok rounded-progress"
                            style={{ width: `${u.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeUpload(u.id)}
                      className="text-text-modal-2 text-[15px] cursor-pointer hover:text-text-modal"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 px-5 py-2">
              <span className="h-[26px] px-3 rounded-pill bg-surface-active border border-brand text-ok text-[11px] font-medium leading-[26px]">Encrypted</span>
              <span className="h-[26px] px-3 rounded-pill border border-modal-stroke text-text-modal-2 text-[11px] font-medium leading-[26px]">3 relays</span>
              <span className="h-[26px] px-3 rounded-pill border border-modal-stroke text-text-modal-2 text-[11px] font-medium leading-[26px]">Private</span>
              <div className="flex-1" />
              <button className="text-[11px] font-medium text-brand-light cursor-pointer hover:brightness-110">Delivery settings</button>
            </div>

            <div className="flex items-center gap-0.5 px-5 py-1.5 border-t border-modal-stroke">
              {["B", "I", "U", "⌁", "▣", "☺", "@", "⋯"].map((glyph) => (
                <button
                  key={glyph}
                  onClick={glyph === "▣" ? handleAttach : undefined}
                  className="w-7 h-7 flex items-center justify-center text-text-modal-2 text-[13px] font-semibold rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150"
                >
                  {glyph}
                </button>
              ))}
              <span className="text-[10px] text-text-placeholder ml-2">Markdown supported</span>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 border-t border-modal-stroke">
              <div className="flex">
                <button className="h-10 px-5 rounded-l-pill bg-brand text-white text-[12px] font-semibold cursor-pointer hover:brightness-110 active:scale-[0.97] transition-all duration-150">
                  Send
                </button>
                <button className="h-10 w-[34px] rounded-r-pill bg-brand text-white flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-[0.97] transition-all duration-150 border-l border-white/20">
                  <span className="text-[12px]">⌄</span>
                </button>
              </div>
              <button className="h-10 px-4 rounded-pill bg-modal-2 border border-modal-stroke text-text-modal-2 text-[12px] font-medium cursor-pointer hover:brightness-110 transition-all duration-150">
                Schedule send
              </button>
              <div className="flex-1" />
              <button className="text-[11px] font-medium text-danger cursor-pointer hover:brightness-110 transition-all duration-150">
                Discard
              </button>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
    </>
  );
}
