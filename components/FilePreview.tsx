"use client";

import { useEffect, useState } from "react";
import { decryptDriveBlob } from "@post/nostr-core";
import type { DriveFile } from "@/lib/types";
import type { Identity } from "@post/nostr-core";

interface FilePreviewProps {
  file: DriveFile;
  identity: Identity | null;
}

function formatSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(bytes >= 10_000 ? 0 : 1)} KB`;
  return `${(bytes / 1_000_000).toFixed(bytes >= 10_000_000 ? 0 : 1)} MB`;
}

export default function FilePreview({ file, identity }: FilePreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        if (file.encryptedBlob && file.encryption && identity?.nsec) {
          const plaintext = await decryptDriveBlob({ ciphertext: file.encryptedBlob, metadata: file.encryption }, identity);
          if (cancelled) return;
          const url = URL.createObjectURL(plaintext);
          setBlobUrl(url);
        } else if (file.blobUrl) {
          setBlobUrl(file.blobUrl);
        } else {
          setBlobUrl(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; if (blobUrl && blobUrl.startsWith("blob:")) URL.revokeObjectURL(blobUrl); };
  }, [file.id]);

  if (loading) {
    return (
      <div className="flex h-[174px] w-full items-center justify-center rounded-[12px] bg-surface-active/40">
        <div className="text-center">
          <div className="text-[52px] font-bold text-brand-light">{file.letter}</div>
          <div className="mt-2 text-[11px] font-semibold text-brand-light">LOADING...</div>
        </div>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="flex h-[174px] w-full items-center justify-center rounded-[12px] bg-surface-active/40">
        <div className="text-center">
          <div className="text-[52px] font-bold text-brand-light">{file.letter}</div>
          <div className="mt-2 text-[11px] font-semibold text-text-tertiary">
            {error || "NO PREVIEW"}
          </div>
          <div className="mt-1 text-[10px] text-text-tertiary">
            {formatSize(file.sizeBytes)}
          </div>
        </div>
      </div>
    );
  }

  const mime = file.mimeType.toLowerCase();

  if (mime.startsWith("image/")) {
    return (
      <div className="flex items-center justify-center rounded-[16px] border border-border bg-sidebar p-2">
        <img src={blobUrl} alt={file.name} className="max-h-[300px] max-w-full rounded-[12px] object-contain" />
      </div>
    );
  }

  if (mime.startsWith("video/")) {
    return (
      <div className="rounded-[16px] border border-border bg-sidebar p-2">
        <video controls className="max-h-[300px] w-full rounded-[12px]" src={blobUrl}>
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  if (mime.startsWith("audio/")) {
    return (
      <div className="flex items-center justify-center rounded-[16px] border border-border bg-sidebar p-6">
        <div className="text-center">
          <div className="text-[52px] font-bold text-brand-light">{file.letter}</div>
          <div className="mt-2 text-[11px] font-semibold text-text-secondary">{file.name}</div>
          <audio controls className="mt-4 w-full" src={blobUrl}>
            Your browser does not support audio playback.
          </audio>
        </div>
      </div>
    );
  }

  if (mime === "application/pdf" || file.fileKind === "pdf") {
    return (
      <div className="rounded-[16px] border border-border bg-sidebar p-2">
        <iframe src={blobUrl} className="h-[300px] w-full rounded-[12px]" title={file.name} />
      </div>
    );
  }

  if (mime === "text/markdown" || file.fileKind === "markdown") {
    return (
      <div className="rounded-[16px] border border-border bg-sidebar p-4">
        <iframe src={blobUrl} className="h-[300px] w-full rounded-[12px] bg-white" title={file.name} />
      </div>
    );
  }

  if (mime === "application/json" || file.fileKind === "json") {
    return (
      <div className="rounded-[16px] border border-border bg-sidebar p-4">
        <iframe src={blobUrl} className="h-[300px] w-full rounded-[12px]" title={file.name} />
      </div>
    );
  }

  return (
    <div className="flex h-[174px] w-full items-center justify-center rounded-[12px] bg-surface-active/40">
      <div className="text-center">
        <div className="text-[52px] font-bold text-brand-light">{file.letter}</div>
        <div className="mt-2 text-[11px] font-semibold text-brand-light">FILE PREVIEW</div>
        <div className="mt-1 text-[10px] text-text-tertiary">
          {formatSize(file.sizeBytes)}
        </div>
      </div>
    </div>
  );
}
