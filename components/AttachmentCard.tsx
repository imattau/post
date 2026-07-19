"use client";

import { memo, useState, useEffect } from "react";
import { FileImage, File, X } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { base64ToUint8Array } from "uint8array-extras";
import { formatSize } from "@/lib/utils";
import { useDriveStore } from "@/lib/stores/drive";

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

const AttachmentCard = memo(function AttachmentCard({
  fileName,
  sizeBytes,
  encrypted,
  sha256,
  mimeType,
  url,
  storedInDrive,
  fileKey,
  fileIv,
  onSaveToDrive,
  messageId,
}: {
  fileName: string;
  sizeBytes: number;
  encrypted: boolean;
  sha256: string;
  mimeType: string;
  url?: string;
  storedInDrive?: boolean;
  fileKey?: string;
  fileIv?: string;
  onSaveToDrive?: () => void;
  messageId?: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  const driveFiles = useDriveStore((s) => s.files);
  const importAttachment = useDriveStore((s) => s.importAttachment);

  const inDrive = storedInDrive ?? driveFiles.some((f) => f.sha256 === sha256);
  const effectiveOnSaveToDrive = onSaveToDrive ?? (messageId && !inDrive
    ? () => importAttachment({ fileName, mimeType, sizeBytes, sha256, url: url ?? "", encrypted }, messageId)
    : undefined);

  useEffect(() => {
    return () => {
      if (decryptedUrl?.startsWith("blob:")) URL.revokeObjectURL(decryptedUrl);
    };
  }, [decryptedUrl]);

  async function handleSave() {
    if (!effectiveOnSaveToDrive) return;
    setSaving(true);
    try {
      await effectiveOnSaveToDrive();
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    setPreviewOpen(true);
    if (!encrypted || !fileKey || !fileIv || !sha256 || decryptedUrl) return;
    setDecrypting(true);
    try {
      const { decryptAttachment, downloadBlob } = await import("@post/nostr-core");
      const { createKeyStore } = await import("@post/nostr-core");
      const keyStore = createKeyStore();
      const identity = await keyStore.load();
      if (!identity?.nsec) return;
      const { decode } = await import("nostr-tools/nip19");
      const decoded = decode(identity.nsec);
      if (decoded.type !== "nsec") return;
      const sk = decoded.data as Uint8Array;

      const serverUrl = (await import("@/lib/stores/blossom")).useBlossomStore.getState().serverUrl;
      const ciphertext = await downloadBlob({ id: sha256, fileName, mimeType, sizeBytes, sha256, url: "", storedInDrive: false, encrypted: true }, sk, serverUrl);

      const plaintext = await decryptAttachment(ciphertext, base64ToUint8Array(fileKey), base64ToUint8Array(fileIv));
      const blobUrl = URL.createObjectURL(plaintext);
      setDecryptedUrl(blobUrl);
    } catch {
      // Decryption failed
    } finally {
      setDecrypting(false);
    }
  }

  return (
    <div className="flex items-center gap-3 h-[88px] px-3 border border-border rounded-[12px] bg-sidebar w-[274px]">
      <div className="w-12 h-14 rounded-[8px] bg-pill-subtle flex items-center justify-center flex-shrink-0">
        {isImage(mimeType) ? (
          <FileImage size={18} className="text-text-tertiary" />
        ) : (
          <File size={18} className="text-text-tertiary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-text-primary truncate">{fileName}</p>
        <p className="text-[10px] text-text-tertiary mt-0.5">
          {formatSize(sizeBytes)} · Blossom{encrypted ? " / encrypted" : ""}
        </p>
        <div className="flex gap-3 mt-1">
          {isImage(mimeType) && (
            <button
              onClick={() => void handlePreview()}
              className="text-[10px] font-medium text-brand-light cursor-pointer hover:brightness-110"
            >
              {decrypting ? "Decrypting..." : "Preview"}
            </button>
          )}
          {inDrive ? (
            <a
              href={`/drive?blob=${sha256}`}
              className="text-[10px] font-medium text-brand-light hover:brightness-110 no-underline"
            >
              Open in Drive
            </a>
          ) : (
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="text-[10px] font-medium text-brand-light cursor-pointer hover:brightness-110 disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save to Drive"}
            </button>
          )}
        </div>
      </div>
      <Dialog.Root open={previewOpen} onOpenChange={(open) => setPreviewOpen(open)}>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Portal>
        <Dialog.Popup className="fixed z-50 max-w-[720px] rounded-[12px] border border-border bg-modal-card p-4 shadow-lg" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="truncate text-[13px] font-semibold text-text-modal">{fileName}</p>
            <Dialog.Close className="text-text-modal-2 hover:text-text-modal cursor-pointer"><X size={18} /></Dialog.Close>
          </div>
          {decryptedUrl ? (
            <img loading="lazy" src={decryptedUrl} alt={fileName} className="max-h-[70vh] max-w-full rounded-[8px] object-contain" />
          ) : url && !encrypted ? (
            <img loading="lazy" src={url} alt={fileName} className="max-h-[70vh] max-w-full rounded-[8px] object-contain" />
          ) : (
            <div className="flex h-48 w-80 items-center justify-center rounded-[8px] bg-pill-subtle">
              <p className="text-[12px] text-text-tertiary">
                {encrypted ? "Encrypted — requires decryption key." : "Preview unavailable for this attachment."}
              </p>
            </div>
          )}
        </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
});

export { isImage };
export default AttachmentCard;
