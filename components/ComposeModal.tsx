"use client";

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useHotkeys } from "react-hotkeys-hook";
import { encryptAttachment } from "@post/nostr-core";
import { decode } from "nostr-tools/nip19";
import { createKeyStore } from "@post/nostr-core";
import { useComposeStore } from "@/lib/stores/compose";
import { useBlossomStore } from "@/lib/stores/blossom";
import { useRelaysStore } from "@/lib/stores/relays";
import { X, ChevronDown, LoaderCircle, AtSign, Ellipsis } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { Menu } from "@base-ui/react/menu";
import { Command } from "cmdk";
import { toast } from "sonner";
import { generateId, wrapTextareaSelection, draftHasContent, parseRecipientEntry } from "@/lib/utils";
import { uint8ArrayToBase64 } from "uint8array-extras";
import FormatToolbar from "./FormatToolbar";
import MessageBody from "./MessageBody";
import UploadProgress from "./UploadProgress";
import { ComposeHeader } from "./compose/ComposeHeader";
import { ContactSuggestions } from "./compose/ContactSuggestions";
import { RecipientRow } from "./compose/RecipientRow";
import { AttachmentCards } from "./compose/AttachmentCards";

interface UploadItem {
  id: string;
  fileName: string;
  sizeBytes: number;
  progress: number;
  status: "pending" | "uploading" | "uploaded" | "failed";
  error: string | null;
}

const CONCURRENCY_LIMIT = 3;



export default function ComposeModal({ onClose }: { onClose: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelectionRef = useRef<number | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [showUploadOverlay, setShowUploadOverlay] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [ccText, setCcText] = useState("");
  const [bccText, setBccText] = useState("");
  const [showDeliverySettings, setShowDeliverySettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showContactSuggestions, setShowContactSuggestions] = useState(false);
  const suggestionsWrapperRef = useRef<HTMLDivElement>(null);
  const cmdkHighlightedRef = useRef(false);

  const status = useComposeStore((s) => s.status);
  const to = useComposeStore((s) => s.draft.to);
  const cc = useComposeStore((s) => s.draft.cc);
  const bcc = useComposeStore((s) => s.draft.bcc);
  const subject = useComposeStore((s) => s.draft.subject);
  const body = useComposeStore((s) => s.draft.body);
  const relayOverrides = useComposeStore((s) => s.draft.relayOverrides);
  const giftWrap = useComposeStore((s) => s.giftWrap);
  const encrypted = useComposeStore((s) => s.encrypted);
  const error = useComposeStore((s) => s.error);

  const updateSubject = useComposeStore((s) => s.updateSubject);
  const updateBody = useComposeStore((s) => s.updateBody);
  const updateRecipients = useComposeStore((s) => s.updateRecipients);
  const addAttachment = useComposeStore((s) => s.addAttachment);
  const updateAttachment = useComposeStore((s) => s.updateAttachment);
  const removeAttachment = useComposeStore((s) => s.removeAttachment);
  const toggleEncrypted = useComposeStore((s) => s.toggleEncrypted);
  const toggleGiftWrap = useComposeStore((s) => s.toggleGiftWrap);
  const close = useComposeStore((s) => s.close);
  const minimize = useComposeStore((s) => s.minimize);
  const discard = useComposeStore((s) => s.discard);
  const send = useComposeStore((s) => s.send);
  const scheduleSend = useComposeStore((s) => s.scheduleSend);
  const retry = useComposeStore((s) => s.retry);

  const uploadFile = useBlossomStore((s) => s.uploadFile);
  const relays = useRelaysStore((s) => s.relays);
  const [recipientText, setRecipientText] = useState("");
  const [recipientError, setRecipientError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "sent") {
      toast.success("Message sent");
      onClose();
    }
  }, [status, onClose]);

  useHotkeys("meta+enter,ctrl+enter", (e) => {
    if (status !== "composing") return;
    e.preventDefault();
    void send();
  }, { enableOnFormTags: true }, [status, send]);

  const handleClose = useCallback(() => {
    if (to.length > 0 || !!subject || !!body) {
      setShowDiscardConfirm(true);
    } else {
      close();
      onClose();
    }
  }, [close, onClose, to, subject, body]);

  const handleDiscard = useCallback(() => {
    discard();
    onClose();
    setShowDiscardConfirm(false);
  }, [discard, onClose]);

  const requestDiscardAction = useCallback(() => {
    if (to.length > 0 || !!subject || !!body) {
      setShowDiscardConfirm(true);
    } else {
      handleDiscard();
    }
  }, [to, subject, body, handleDiscard]);

  const parseRecipient = useCallback((value: string) => parseRecipientEntry(value), []);

  const addRecipientFromText = useCallback(async () => {
    const value = recipientText.trim();
    if (!value) return;

    try {
      const recipient = await parseRecipient(value);
      updateRecipients([...to, recipient], cc, bcc);
      setRecipientText("");
      setRecipientError(null);
      setShowContactSuggestions(false);
    } catch (err) {
      setRecipientError(err instanceof Error ? err.message : "Invalid recipient");
    }
  }, [bcc, cc, to, parseRecipient, recipientText, updateRecipients]);

  const selectContact = useCallback((contact: { pubkey: string; npub: string; name: string; picture?: string }) => {
    updateRecipients(
      [...to, { pubkey: contact.pubkey, npub: contact.npub, name: contact.name, avatarUrl: contact.picture || "", isGroup: false }],
      cc,
      bcc
    );
    setRecipientText("");
    setRecipientError(null);
    setShowContactSuggestions(false);
  }, [bcc, cc, to, updateRecipients]);

  const addCcFromText = useCallback(async () => {
    const value = ccText.trim();
    if (!value) return;
    try {
      const recipient = await parseRecipient(value);
      updateRecipients(to, [...cc, recipient], bcc);
      setCcText("");
      setRecipientError(null);
    } catch (err) {
      setRecipientError(err instanceof Error ? err.message : "Invalid Cc recipient");
    }
  }, [ccText, bcc, cc, to, parseRecipient, updateRecipients]);

  const addBccFromText = useCallback(async () => {
    const value = bccText.trim();
    if (!value) return;
    try {
      const recipient = await parseRecipient(value);
      updateRecipients(to, cc, [...bcc, recipient]);
      setBccText("");
      setRecipientError(null);
    } catch (err) {
      setRecipientError(err instanceof Error ? err.message : "Invalid Bcc recipient");
    }
  }, [bccText, bcc, cc, to, parseRecipient, updateRecipients]);

  const toggleRelayOverride = useCallback((url: string) => {
    const next = relayOverrides.includes(url)
      ? relayOverrides.filter((relay) => relay !== url)
      : [...relayOverrides, url];
    useComposeStore.getState().setRelayOverrides(next);
  }, [relayOverrides]);

  const uploadSingleFile = useCallback(async (
    file: File,
    sk: Uint8Array,
    onProgress: (id: string, pct: number) => void,
    onDone: (id: string, status: "uploaded" | "failed", error?: string) => void
  ) => {
    const id = generateId();
    addAttachment(file);
    onProgress(id, 0);

    try {
      const { ciphertext, fileKey, fileIv } = await encryptAttachment(file);
      const ciphertextBytes = await ciphertext.arrayBuffer();
      const wrappedFile = new (window as any).File([ciphertextBytes], file.name, { type: "application/octet-stream" }) as File;

      let lastThrottled = 0;
      const result = await uploadFile(wrappedFile, sk, (pct) => {
        const now = Date.now();
        if (now - lastThrottled > 50 || pct === 100) {
          lastThrottled = now;
          onProgress(id, pct);
        }
      });
      result.fileKey = uint8ArrayToBase64(fileKey);
      result.fileIv = uint8ArrayToBase64(fileIv);
      result.encrypted = true;
      onDone(id, "uploaded");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      onDone(id, "failed", message);
    }
  }, [addAttachment, uploadFile]);

  const handleFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    await processFiles(files);
    if (e.target) e.target.value = "";
  }, []);

  const processFiles = useCallback(async (files: File[]) => {
    setShowUploadOverlay(true);

    const keyStore = createKeyStore();
    const identity = await keyStore.load();
    if (!identity?.nsec) return;

    const nsecDecoded = decode(identity.nsec);
    if (nsecDecoded.type !== "nsec") return;
    const sk = nsecDecoded.data;

    const results: UploadItem[] = files.map((file) => ({
      id: generateId(),
      fileName: file.name,
      sizeBytes: file.size,
      progress: 0,
      status: "pending" as const,
      error: null,
    }));
    setUploads(results);

    // batch progress updates per animation frame
    const progressMap = new Map<string, number>();
    let flushScheduled = false;
    const scheduleFlush = () => {
      if (flushScheduled) return;
      flushScheduled = true;
      requestAnimationFrame(() => {
        flushScheduled = false;
        if (progressMap.size === 0) return;
        const batch = new Map(progressMap);
        progressMap.clear();
        setUploads((prev) => prev.map((u) => {
          const pct = batch.get(u.id);
          if (pct === undefined) return u;
          return { ...u, progress: pct, status: "uploading" as const };
        }));
      });
    };

    const updateProgress = (id: string, pct: number) => {
      progressMap.set(id, pct);
      scheduleFlush();
      updateAttachment(files.find((_, i) => results[i].id === id)!.name, { progress: pct, status: "uploading" });
    };
    const markDone = (id: string, status: "uploaded" | "failed", error?: string) => {
      setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status, progress: status === "uploaded" ? 100 : u.progress, error: error ?? null } : u)));
      const file = files.find((_, i) => results[i].id === id);
      if (file) updateAttachment(file.name, { status, progress: status === "uploaded" ? 100 : (progressMap.get(id) ?? 0), error: error ?? null });
    };

    const queue = files.map((file, i) => ({ file, id: results[i].id }));
    let index = 0;

    async function worker() {
      while (index < queue.length) {
        const item = queue[index++];
        await uploadSingleFile(item.file, sk, updateProgress, markDone);
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, queue.length) }, () => worker());
    await Promise.all(workers);
  }, [uploadSingleFile, updateAttachment]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((acceptedFiles: File[]) => {
      void processFiles(acceptedFiles);
    }, [processFiles]),
    noClick: true,
    noKeyboard: true,
  });

  const applyFormat = useCallback((prefix: string, suffix = "", fallback = "") => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart ?? body.length;
    const selection = body.slice(start, textareaRef.current.selectionEnd ?? body.length);
    const content = selection || fallback;
    const next = wrapTextareaSelection(textareaRef.current, prefix, suffix, body, fallback);
    const nextCaret = start + prefix.length + content.length + suffix.length;

    pendingSelectionRef.current = nextCaret;
    updateBody(next);
  }, [body, updateBody]);

  useLayoutEffect(() => {
    if (pendingSelectionRef.current == null) return;
    const position = pendingSelectionRef.current;
    pendingSelectionRef.current = null;
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(position, position);
  }, [body]);

  const handleSchedule = useCallback(async () => {
    if (!scheduleDate || !scheduleTime) return;
    const at = new Date(`${scheduleDate}T${scheduleTime}`).getTime();
    if (at > Date.now()) {
      await scheduleSend(at);
      setShowSchedule(false);
    }
  }, [scheduleDate, scheduleTime, scheduleSend]);

  const handleRemoveUpload = useCallback((id: string, fileName: string) => {
    setUploads((prev) => prev.filter((x) => x.id !== id));
    removeAttachment(fileName);
  }, [removeAttachment]);

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const handleRecipientFocus = useCallback(() => setShowContactSuggestions(true), []);
  const handleRecipientBlur = useCallback(() => {
    requestAnimationFrame(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowContactSuggestions(false);
      }
    });
  }, []);

  const handleCcTextChange = useCallback((v: string) => { setCcText(v); setRecipientError(null); }, []);
  const handleBccTextChange = useCallback((v: string) => { setBccText(v); setRecipientError(null); }, []);
  const handleCcAdd = useCallback(() => { void addCcFromText(); }, [addCcFromText]);
  const handleBccAdd = useCallback(() => { void addBccFromText(); }, [addBccFromText]);

  if (status === "minimized") {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 h-12 px-4 rounded-pill bg-modal-card border border-modal-stroke shadow-lg cursor-pointer hover:brightness-110 transition-all duration-200"
        onClick={() => useComposeStore.getState().restore()}
      >
        <span className="text-text-modal text-[13px] font-medium truncate max-w-[200px]">
          {subject || "New message"}
        </span>
        <span className="text-text-tertiary text-[11px]">{to.length ? `To: ${to[0].name}` : "No recipient"}</span>
        <button
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="w-6 h-6 flex items-center justify-center text-text-modal-2 hover:text-text-modal cursor-pointer"
        ><X size={14} /></button>
      </div>
    );
  }

  const isSending = status === "sending";

  return (
    <>
    <Dialog.Root open modal onOpenChange={(open) => { if (!open) handleClose(); }}>
      <Dialog.Backdrop className="fixed inset-0 z-40 transition-opacity duration-200" style={{ backgroundColor: "rgba(5,7,11,0.44)" }} />
      <Dialog.Portal>
      <Dialog.Popup className="fixed z-50 animate-[composeOpen_250ms_ease-out]"         style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 730,
          height: 784,
          maxWidth: "min(730px, calc(100vw - 48px))",
          maxHeight: "min(784px, calc(100dvh - 48px))",
        }}>
        <div className="w-full h-full rounded-[24px]" style={{ boxShadow: "0 20px 40px 0 rgba(0,0,0,0.5)" }}>
          <div
            {...getRootProps()}
            className={`w-full h-full rounded-[20px] bg-modal-card border border-modal-stroke flex flex-col overflow-hidden ${isDragActive ? "ring-2 ring-brand" : ""}`}
          >
            <ComposeHeader onRequestClose={handleClose} />

            {/* To field */}
            <div className="flex items-start gap-3 px-5 py-3 border-b border-modal-stroke">
              <span className="text-[12px] font-medium text-text-modal-2 pt-1">To</span>
              <Command shouldFilter={false} className="flex-1 flex flex-wrap items-center gap-1.5 relative" ref={suggestionsRef}>
                {to.map((recipient) => (
                  <span
                    key={recipient.pubkey}
                    className="h-7 pl-2.5 pr-1 rounded-pill bg-surface-active border border-brand text-brand-light text-[12px] font-medium leading-[26px] flex items-center gap-1"
                  >
                    {recipient.name}
                    <button
                      onClick={() => updateRecipients(to.filter((r) => r.pubkey !== recipient.pubkey), cc, bcc)}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-brand/20 cursor-pointer"
                      disabled={isSending}
                    ><X size={10} /></button>
                  </span>
                ))}
                <input
                  type="text"
                  value={recipientText}
                  onChange={(e) => { setRecipientText(e.target.value); setRecipientError(null); setShowContactSuggestions(true); }}
                  onFocus={handleRecipientFocus}
                  onBlur={handleRecipientBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      if (!cmdkHighlightedRef.current) {
                        e.preventDefault();
                        void addRecipientFromText();
                      }
                    }
                    if (e.key === "Escape") setShowContactSuggestions(false);
                  }}
                  placeholder={to.length === 0 ? "Search contacts, NIP-05, or add npub/pubkey" : "Add another"}
                  className="min-w-[180px] flex-1 bg-transparent border-none outline-none text-[13px] text-text-modal placeholder-text-placeholder"
                  disabled={isSending}
                />
                {showContactSuggestions && (
                  <ContactSuggestions recipientText={recipientText} onSelect={selectContact} highlightedRef={cmdkHighlightedRef} />
                )}
              </Command>
              <div className="flex gap-1">
                <button onClick={() => setShowCc((show) => !show)} className="text-[11px] font-medium text-brand-light cursor-pointer hover:brightness-110">Cc</button>
                <button onClick={() => setShowBcc((show) => !show)} className="text-[11px] font-medium text-brand-light cursor-pointer hover:brightness-110">Bcc</button>
              </div>
            </div>
             {showCc && (
              <RecipientRow
                label="Cc"
                recipients={cc}
                text={ccText}
                onTextChange={handleCcTextChange}
                onAdd={handleCcAdd}
                onRemove={(pubkey) => updateRecipients(to, cc.filter((r) => r.pubkey !== pubkey), bcc)}
                placeholder="Add Cc npub or pubkey"
              />
            )}
            {showBcc && (
              <RecipientRow
                label="Bcc"
                recipients={bcc}
                text={bccText}
                onTextChange={handleBccTextChange}
                onAdd={handleBccAdd}
                onRemove={(pubkey) => updateRecipients(to, cc, bcc.filter((r) => r.pubkey !== pubkey))}
                placeholder="Add Bcc npub or pubkey"
              />
            )}
            {recipientError && <p className="px-5 pt-1 text-[11px] text-danger">{recipientError}</p>}

            {/* Subject field */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-modal-stroke">
              <span className="text-[12px] font-medium text-text-modal-2">Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => updateSubject(e.target.value)}
                placeholder="Add a subject…"
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-text-modal placeholder-text-placeholder"
                disabled={isSending}
              />
            </div>

            {showPreview ? (
              <div className="flex-1 p-5 overflow-y-auto">
                <MessageBody body={body || "Nothing to preview yet."} />
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => updateBody(e.target.value)}
                placeholder="Write your message…"
                disabled={isSending}
                className="flex-1 p-5 text-[14px] text-text-modal outline-none overflow-y-auto resize-none bg-transparent placeholder-text-placeholder min-h-0"
              />
            )}

            {/* Attachment cards */}
            <AttachmentCards uploads={uploads} onRemove={handleRemoveUpload} />

            {/* Status pills */}
            <div className="flex items-center gap-2 px-5 py-2">
              <button
                onClick={toggleEncrypted}
                className={`h-[26px] px-3 rounded-pill border text-[11px] font-medium leading-[26px] cursor-pointer transition-all duration-150 ${
                  encrypted
                    ? "bg-surface-active border-brand text-ok"
                    : "border-modal-stroke text-text-modal-2 hover:border-brand/50"
                }`}
              >
                {encrypted ? "Encrypted" : "Not encrypted"}
              </button>
              <span className="h-[26px] px-3 rounded-pill border border-modal-stroke text-text-modal-2 text-[11px] font-medium leading-[26px]">
                {relayOverrides.length || relays.length} relays
              </span>
              <button
                onClick={toggleGiftWrap}
                className={`h-[26px] px-3 rounded-pill border text-[11px] font-medium leading-[26px] cursor-pointer transition-all duration-150 ${
                  giftWrap
                    ? "bg-surface-active border-brand text-brand-light"
                    : "border-modal-stroke text-text-modal-2 hover:border-brand/50"
                }`}
              >
                {giftWrap ? "Private ✓" : "Private"}
              </button>
              <div className="flex-1" />
              <button onClick={() => setShowDeliverySettings((show) => !show)} className="text-[11px] font-medium text-brand-light cursor-pointer hover:brightness-110">Delivery settings</button>
            </div>
            {showDeliverySettings && (
              <div className="mx-5 mb-2 max-h-28 overflow-y-auto rounded-[10px] border border-modal-stroke bg-modal-2 p-2">
                <p className="mb-1 text-[11px] font-medium text-text-modal-2">Relay overrides</p>
                {relays.map((relay) => (
                  <label key={relay.url} className="flex items-center gap-2 py-1 text-[11px] text-text-modal-2">
                    <input
                      type="checkbox"
                      checked={relayOverrides.includes(relay.url)}
                      onChange={() => toggleRelayOverride(relay.url)}
                    />
                    <span>{relay.url}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Error message */}
            {status === "failed" && error && (
              <div className="px-5 py-1">
                <p className="text-[11px] text-danger">{error}</p>
              </div>
            )}

            {/* Format toolbar */}
            <FormatToolbar onFormat={applyFormat} onAttach={() => fileInputRef.current?.click()} showMarkdownLabel>
              <button disabled className="w-7 h-7 flex items-center justify-center text-text-tertiary rounded cursor-not-allowed opacity-50"><AtSign size={13} /></button>
              <button disabled className="w-7 h-7 flex items-center justify-center text-text-tertiary rounded cursor-not-allowed opacity-50"><Ellipsis size={13} /></button>
            </FormatToolbar>

            {/* Schedule send popover */}
            {showSchedule && (
              <div className="px-5 py-2 border-t border-modal-stroke flex items-center gap-2">
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="h-8 px-2 text-[12px] bg-modal-2 border border-modal-stroke rounded text-text-modal outline-none" />
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="h-8 px-2 text-[12px] bg-modal-2 border border-modal-stroke rounded text-text-modal outline-none" />
                <button onClick={handleSchedule} className="h-8 px-3 rounded bg-brand text-white text-[11px] font-semibold cursor-pointer hover:brightness-110">Schedule</button>
                <button onClick={() => setShowSchedule(false)} className="h-8 px-3 text-[11px] text-text-secondary cursor-pointer">Cancel</button>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 px-5 py-3 border-t border-modal-stroke">
              <div className="flex relative">
                <button
                  onClick={send}
                  disabled={isSending || to.length === 0}
                  className="h-10 px-5 rounded-l-[12px] bg-brand text-white text-[12px] font-semibold cursor-pointer hover:brightness-110 active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSending ? (
                    <><LoaderCircle size={14} className="animate-spin" /> Sending</>
                  ) : (
                    "Send"
                  )}
                </button>
                <Menu.Root>
                  <Menu.Trigger
                    disabled={isSending}
                    className="h-10 w-[34px] rounded-r-[12px] bg-brand text-white flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-[0.97] transition-all duration-150 border-l border-white/20 disabled:opacity-40"
                  >
                    <ChevronDown size={12} />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner className="absolute bottom-full left-0 mb-1 z-10" side="top" align="start">
                      <Menu.Popup className="w-44 rounded-pill bg-pill-subtle border border-border shadow-lg overflow-hidden">
                        <Menu.Item onClick={send} className="w-full px-4 py-2.5 text-[12px] text-text-primary text-left hover:bg-surface-active transition-colors duration-150 cursor-pointer data-[highlighted]:bg-surface-active">Send</Menu.Item>
                        <Menu.Item onClick={() => setShowPreview((show) => !show)} className="w-full px-4 py-2.5 text-[12px] text-text-secondary text-left hover:bg-surface-active transition-colors duration-150 cursor-pointer data-[highlighted]:bg-surface-active">
                          {showPreview ? "Edit" : "Preview"}
                        </Menu.Item>
                        <Menu.Item onClick={() => useComposeStore.getState().autosave()} className="w-full px-4 py-2.5 text-[12px] text-text-secondary text-left hover:bg-surface-active transition-colors duration-150 cursor-pointer data-[highlighted]:bg-surface-active">Save Draft</Menu.Item>
                        <Menu.Item onClick={requestDiscardAction} className="w-full px-4 py-2.5 text-[12px] text-danger text-left hover:bg-surface-active transition-colors duration-150 cursor-pointer data-[highlighted]:bg-surface-active">Discard</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </div>
              <button
                onClick={() => setShowSchedule(true)}
                disabled={isSending}
                className="h-10 px-4 rounded-pill bg-modal-2 border border-modal-stroke text-text-modal-2 text-[12px] font-medium cursor-pointer hover:brightness-110 transition-all duration-150 disabled:opacity-40"
              >
                Schedule send
              </button>
              {status === "failed" && (
                <button
                  onClick={retry}
                  className="h-10 px-4 rounded-pill bg-brand text-white text-[12px] font-semibold cursor-pointer hover:brightness-110 transition-all duration-150"
                >
                  Retry
                </button>
              )}
              <div className="flex-1" />
              <button onClick={requestDiscardAction} disabled={isSending} className="text-[11px] font-medium text-danger cursor-pointer hover:brightness-110 transition-all duration-150 disabled:opacity-40">
                Discard
              </button>
            </div>
          </div>
        </div>
        </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {showUploadOverlay && uploads.length > 0 && (
        <UploadProgress
          files={uploads.map((u) => ({
            id: u.id,
            name: u.fileName,
            sizeBytes: u.sizeBytes,
            progress: u.progress,
            status: u.status === "uploaded" ? "complete" as const : u.status as "pending" | "uploading" | "failed",
            letter: u.fileName.charAt(0).toUpperCase(),
            color: "var(--color-info)",
          }))}
          totalComplete={uploads.filter((u) => u.status === "uploaded").length}
          totalCount={uploads.length}
          onHide={() => setShowUploadOverlay(false)}
          onCancel={(id) => {
            setUploads((prev) => prev.filter((u) => u.id !== id));
          }}
          onRetry={(id) => {
            const file = uploads.find((u) => u.id === id);
            if (file) {
              setUploads((prev) => prev.map((u) => u.id === id ? { ...u, status: "pending", error: null } : u));
            }
          }}
        />
      )}

      <Dialog.Root open={showDiscardConfirm} onOpenChange={(open) => { if (!open) setShowDiscardConfirm(false); }}>
        <Dialog.Backdrop className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(5,7,11,0.44)" }} />
        <Dialog.Portal>
        <Dialog.Popup className="fixed z-50" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <div className="w-[320px] rounded-[14px] border border-border bg-modal-card p-5 shadow-lg">
            <p className="text-[14px] font-semibold text-text-modal">Discard draft?</p>
            <p className="mt-2 text-[12px] text-text-modal-2">You will lose any unsaved changes.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close className="h-8 px-4 rounded-[10px] border border-border bg-modal-2 text-[12px] font-medium text-text-modal-2 cursor-pointer hover:brightness-110">
                Cancel
              </Dialog.Close>
              <button
                onClick={handleDiscard}
                className="h-8 px-4 rounded-[10px] bg-danger text-white text-[12px] font-semibold cursor-pointer hover:brightness-110"
              >
                Discard
              </button>
            </div>
          </div>
        </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <input ref={fileInputRef} type="file" multiple onChange={handleFiles} className="hidden" />
    </>
  );
}
