"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useComposeStore } from "@/lib/stores/compose";
import { useBlossomStore } from "@/lib/stores/blossom";
import { useRelaysStore } from "@/lib/stores/relays";
import { useContactsStore } from "@/lib/stores/contacts";
import MessageBody from "./MessageBody";
import UploadProgress from "./UploadProgress";

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
  const bodyRef = useRef<HTMLDivElement>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [showSendMenu, setShowSendMenu] = useState(false);
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

  const status = useComposeStore((s) => s.status);
  const draft = useComposeStore((s) => s.draft);
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
  const open = useComposeStore((s) => s.open);
  const minimize = useComposeStore((s) => s.minimize);
  const discard = useComposeStore((s) => s.discard);
  const send = useComposeStore((s) => s.send);
  const scheduleSend = useComposeStore((s) => s.scheduleSend);
  const retry = useComposeStore((s) => s.retry);

  const uploadFile = useBlossomStore((s) => s.uploadFile);
  const relays = useRelaysStore((s) => s.relays);
  const [recipientText, setRecipientText] = useState("");
  const [recipientError, setRecipientError] = useState<string | null>(null);

  const contacts = useContactsStore((s) => s.contacts);
  const contactSuggestions = useMemo(() => {
    if (!recipientText.trim()) return [];
    const q = recipientText.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.npub.toLowerCase().includes(q) ||
        c.pubkey.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [contacts, recipientText]);

  const handleAttach = useCallback(() => fileInputRef.current?.click(), []);

  useEffect(() => {
    if (status === "closed") open();
  }, [status, open]);

  useEffect(() => {
    if (bodyRef.current && bodyRef.current.innerText !== draft.body) {
      bodyRef.current.innerText = draft.body;
    }
  }, [draft.id, draft.body]);

  useEffect(() => {
    if (status === "sent") {
      const timer = setTimeout(onClose, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  const handleClose = useCallback(() => {
    if (draft.subject || draft.body || draft.to.length > 0) {
      setShowDiscardConfirm(true);
    } else {
      close();
      onClose();
    }
  }, [close, onClose, draft]);

  const handleDiscard = useCallback(() => {
    discard();
    onClose();
    setShowDiscardConfirm(false);
  }, [discard, onClose]);

  const requestDiscard = useCallback(() => {
    if (draft.subject || draft.body || draft.to.length > 0) {
      setShowDiscardConfirm(true);
    } else {
      handleDiscard();
    }
  }, [draft, handleDiscard]);

  const parseRecipient = useCallback(async (value: string) => {
    let pubkey = value;
    let npub = value;

    if (value.startsWith("npub1")) {
      const { decode } = await import("nostr-tools/nip19");
      const decoded = decode(value);
      if (decoded.type !== "npub") throw new Error("Expected an npub");
      pubkey = decoded.data;
      npub = value;
    } else if (value.includes("@") && !value.startsWith("npub1")) {
      const { resolveNip05 } = await import("@post/nostr-core");
      const result = await resolveNip05(value);
      if (!result) throw new Error("NIP-05 lookup failed for this address");
      pubkey = result.pubkey;
      npub = result.pubkey;
      const { npubEncode } = await import("nostr-tools/nip19");
      npub = npubEncode(result.pubkey);
      return {
        pubkey,
        npub,
        name: value,
        avatarUrl: "",
        isGroup: false,
      };
    }

    if (!/^[0-9a-f]{64}$/i.test(pubkey)) {
      throw new Error("Enter a 64-character pubkey, npub, or NIP-05 address");
    }

    return {
      pubkey,
      npub,
      name: value.startsWith("npub1") ? `${value.slice(0, 12)}…` : `${pubkey.slice(0, 8)}…`,
      avatarUrl: "",
      isGroup: false,
    };
  }, []);

  const addRecipientFromText = useCallback(async () => {
    const value = recipientText.trim();
    if (!value) return;

    try {
      const recipient = await parseRecipient(value);
      updateRecipients([...draft.to, recipient], draft.cc, draft.bcc);
      setRecipientText("");
      setRecipientError(null);
      setShowContactSuggestions(false);
    } catch (err) {
      setRecipientError(err instanceof Error ? err.message : "Invalid recipient");
    }
  }, [draft.bcc, draft.cc, draft.to, parseRecipient, recipientText, updateRecipients]);

  const selectContact = useCallback((contact: typeof contacts[number]) => {
    updateRecipients(
      [...draft.to, { pubkey: contact.pubkey, npub: contact.npub, name: contact.name, avatarUrl: contact.picture || "", isGroup: false }],
      draft.cc,
      draft.bcc
    );
    setRecipientText("");
    setRecipientError(null);
    setShowContactSuggestions(false);
  }, [draft.bcc, draft.cc, draft.to, updateRecipients]);

  const addCcFromText = useCallback(async () => {
    const value = ccText.trim();
    if (!value) return;
    try {
      const recipient = await parseRecipient(value);
      updateRecipients(draft.to, [...draft.cc, recipient], draft.bcc);
      setCcText("");
      setRecipientError(null);
    } catch (err) {
      setRecipientError(err instanceof Error ? err.message : "Invalid Cc recipient");
    }
  }, [ccText, draft.bcc, draft.cc, draft.to, parseRecipient, updateRecipients]);

  const addBccFromText = useCallback(async () => {
    const value = bccText.trim();
    if (!value) return;
    try {
      const recipient = await parseRecipient(value);
      updateRecipients(draft.to, draft.cc, [...draft.bcc, recipient]);
      setBccText("");
      setRecipientError(null);
    } catch (err) {
      setRecipientError(err instanceof Error ? err.message : "Invalid Bcc recipient");
    }
  }, [bccText, draft.bcc, draft.cc, draft.to, parseRecipient, updateRecipients]);

  const toggleRelayOverride = useCallback((url: string) => {
    const next = draft.relayOverrides.includes(url)
      ? draft.relayOverrides.filter((relay) => relay !== url)
      : [...draft.relayOverrides, url];
    useComposeStore.getState().setRelayOverrides(next);
  }, [draft.relayOverrides]);

  const handleFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setShowUploadOverlay(true);

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
      addAttachment(file);
      setUploads((prev) => [...prev, { id, fileName: file.name, sizeBytes: file.size, progress: 0, status: "pending", error: null }]);
      setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: "uploading" } : u)));
      updateAttachment(file.name, { status: "uploading" });

      try {
        const result = await uploadFile(file, sk, (pct) => {
          setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, progress: pct } : u)));
          updateAttachment(file.name, { progress: pct });
        });
        setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, status: "uploaded", progress: 100 } : u)));
        updateAttachment(file.name, { status: "uploaded", progress: 100, result });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, status: "failed", error: message } : u
          )
        );
        updateAttachment(file.name, { status: "failed", error: message });
      }
    }
    if (e.target) e.target.value = "";
  }, [addAttachment, updateAttachment, uploadFile]);

  const insertFormat = useCallback((prefix: string, suffix: string) => {
    if (!bodyRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const text = range.toString();
    range.deleteContents();
    range.insertNode(document.createTextNode(prefix + text + suffix));
    updateBody(bodyRef.current.innerText);
  }, [updateBody]);

  const handleBodyInput = useCallback(() => {
    if (bodyRef.current) {
      updateBody(bodyRef.current.innerText);
    }
  }, [updateBody]);

  const handleSchedule = useCallback(async () => {
    if (!scheduleDate || !scheduleTime) return;
    const at = new Date(`${scheduleDate}T${scheduleTime}`).getTime();
    if (at > Date.now()) {
      await scheduleSend(at);
      setShowSchedule(false);
    }
  }, [scheduleDate, scheduleTime, scheduleSend]);

  const formatToolbar = (
    <div className="flex items-center gap-0.5 px-5 py-1.5 border-t border-modal-stroke">
      <button onMouseDown={(e) => { e.preventDefault(); insertFormat("**", "**"); }} className="w-7 h-7 flex items-center justify-center text-text-modal-2 text-[13px] font-semibold rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150">B</button>
      <button onMouseDown={(e) => { e.preventDefault(); insertFormat("_", "_"); }} className="w-7 h-7 flex items-center justify-center text-text-modal-2 text-[13px] font-medium italic rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150">I</button>
      <button onMouseDown={(e) => { e.preventDefault(); insertFormat("__", "__"); }} className="w-7 h-7 flex items-center justify-center text-text-modal-2 text-[13px] font-medium underline rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150">U</button>
      <button onMouseDown={(e) => { e.preventDefault(); insertFormat("[", "](url)"); }} className="w-7 h-7 flex items-center justify-center text-text-modal-2 text-[13px] rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150">⌁</button>
      <button onClick={handleAttach} className="w-7 h-7 flex items-center justify-center text-text-modal-2 text-[13px] rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150">▣</button>
      <button onMouseDown={(e) => { e.preventDefault(); insertFormat("☺", ""); }} className="w-7 h-7 flex items-center justify-center text-text-modal-2 text-[13px] rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150">☺</button>
      <button disabled className="w-7 h-7 flex items-center justify-center text-text-tertiary text-[13px] rounded cursor-not-allowed opacity-50">@</button>
      <button disabled className="w-7 h-7 flex items-center justify-center text-text-tertiary text-[13px] rounded cursor-not-allowed opacity-50">⋯</button>
      <span className="text-[10px] text-text-placeholder ml-auto">Markdown supported</span>
    </div>
  );

  function formatSize(bytes: number): string {
    if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`;
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  }

  if (status === "minimized") {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 h-12 px-4 rounded-pill bg-modal-card border border-modal-stroke shadow-lg cursor-pointer hover:brightness-110 transition-all duration-200"
        onClick={() => useComposeStore.getState().restore()}
      >
        <span className="text-text-modal text-[13px] font-medium truncate max-w-[200px]">
          {draft.subject || "New message"}
        </span>
        <span className="text-text-tertiary text-[11px]">{draft.to.length ? `To: ${draft.to[0].name}` : "No recipient"}</span>
        <button
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          className="w-6 h-6 flex items-center justify-center text-text-modal-2 hover:text-text-modal cursor-pointer"
        >×</button>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <>
        <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(5,7,11,0.44)" }} />
        <div className="fixed z-50" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
          <div className="rounded-[20px] bg-modal-card border border-modal-stroke px-10 py-8 text-center shadow-lg">
            <p className="text-ok text-[16px] font-semibold">Message sent</p>
          </div>
        </div>
      </>
    );
  }

  const isSending = status === "sending";

  return (
    <>
      <div className="fixed inset-0 z-40 transition-opacity duration-200" style={{ backgroundColor: "rgba(5,7,11,0.44)" }} onClick={handleClose} />
      <div
        className="fixed z-50 animate-[composeOpen_250ms_ease-out]"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 730, height: 784 }}
      >
        <div className="w-full h-full rounded-[24px]" style={{ boxShadow: "0 20px 40px 0 rgba(0,0,0,0.5)" }}>
          <div className="w-full h-full rounded-[20px] bg-modal-card border border-modal-stroke flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-modal-stroke">
              <div className="flex items-center gap-3">
                <span className="text-[16px] font-semibold text-text-modal">New message</span>
                {draft.savedAt && status === "composing" && (
                  <span className="text-[11px] font-medium text-ok">Draft saved</span>
                )}
                {status === "sending" && <span className="text-[11px] font-medium text-brand-light">Sending…</span>}
                {status === "failed" && <span className="text-[11px] font-medium text-danger">Send failed</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={minimize}
                  disabled={isSending}
                  className="w-[30px] h-[30px] rounded-[8px] bg-modal-2 border border-modal-stroke flex items-center justify-center cursor-pointer hover:brightness-110 transition-all duration-150 disabled:opacity-40"
                >
                  <span className="text-text-modal-2 text-[15px]">–</span>
                </button>
                <button
                  onClick={requestDiscard}
                  disabled={isSending}
                  className="w-[30px] h-[30px] rounded-[8px] bg-modal-2 border border-modal-stroke flex items-center justify-center cursor-pointer hover:brightness-110 transition-all duration-150 disabled:opacity-40"
                >
                  <span className="text-text-modal-2 text-[15px]">×</span>
                </button>
              </div>
            </div>

            {/* To field */}
            <div className="flex items-start gap-3 px-5 py-3 border-b border-modal-stroke">
              <span className="text-[12px] font-medium text-text-modal-2 pt-1">To</span>
              <div className="flex-1 flex flex-wrap items-center gap-1.5 relative">
                {draft.to.map((recipient) => (
                  <span
                    key={recipient.pubkey}
                    className="h-7 px-2.5 rounded-pill bg-surface-active border border-brand text-brand-light text-[12px] font-medium leading-[26px]"
                  >
                    {recipient.name}
                  </span>
                ))}
                <input
                  type="text"
                  value={recipientText}
                  onChange={(e) => { setRecipientText(e.target.value); setRecipientError(null); setShowContactSuggestions(true); }}
                  onFocus={() => setShowContactSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowContactSuggestions(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      void addRecipientFromText();
                    }
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      e.preventDefault();
                    }
                    if (e.key === "Escape") setShowContactSuggestions(false);
                  }}
                  placeholder={draft.to.length === 0 ? "Search contacts, NIP-05, or add npub/pubkey" : "Add another"}
                  className="min-w-[180px] flex-1 bg-transparent border-none outline-none text-[13px] text-text-modal placeholder-text-placeholder"
                  disabled={isSending}
                />
                {showContactSuggestions && contactSuggestions.length > 0 && (
                  <div className="absolute left-0 top-full mt-1 w-full z-20 rounded-[10px] border border-border bg-modal-card shadow-lg overflow-hidden">
                    {contactSuggestions.map((contact) => (
                      <button
                        key={contact.id}
                        onMouseDown={(e) => { e.preventDefault(); selectContact(contact); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-active transition-colors duration-150 cursor-pointer"
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0`} style={{ backgroundColor: contact.color }}>
                          <span className="text-white text-[10px] font-semibold">{contact.initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] font-medium text-text-modal truncate block">{contact.name}</span>
                          <span className="text-[10px] text-text-tertiary truncate block">{contact.handle}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setShowCc((show) => !show)} className="text-[11px] font-medium text-brand-light cursor-pointer hover:brightness-110">Cc</button>
                <button onClick={() => setShowBcc((show) => !show)} className="text-[11px] font-medium text-brand-light cursor-pointer hover:brightness-110">Bcc</button>
              </div>
            </div>
            {showCc && (
              <div className="flex items-start gap-3 px-5 py-2 border-b border-modal-stroke">
                <span className="text-[12px] font-medium text-text-modal-2 pt-1">Cc</span>
                <div className="flex-1 flex flex-wrap items-center gap-1.5">
                  {draft.cc.map((recipient) => (
                    <span key={recipient.pubkey} className="h-7 px-2.5 rounded-pill bg-pill-subtle border border-modal-stroke text-text-modal-2 text-[12px] font-medium leading-[26px]">
                      {recipient.name}
                    </span>
                  ))}
                  <input
                    type="text"
                    value={ccText}
                    onChange={(e) => { setCcText(e.target.value); setRecipientError(null); }}
                    onBlur={() => { void addCcFromText(); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        void addCcFromText();
                      }
                    }}
                    placeholder="Add Cc npub or pubkey"
                    className="min-w-[180px] flex-1 bg-transparent border-none outline-none text-[13px] text-text-modal placeholder-text-placeholder"
                    disabled={isSending}
                  />
                </div>
              </div>
            )}
            {showBcc && (
              <div className="flex items-start gap-3 px-5 py-2 border-b border-modal-stroke">
                <span className="text-[12px] font-medium text-text-modal-2 pt-1">Bcc</span>
                <div className="flex-1 flex flex-wrap items-center gap-1.5">
                  {draft.bcc.map((recipient) => (
                    <span key={recipient.pubkey} className="h-7 px-2.5 rounded-pill bg-pill-subtle border border-modal-stroke text-text-modal-2 text-[12px] font-medium leading-[26px]">
                      {recipient.name}
                    </span>
                  ))}
                  <input
                    type="text"
                    value={bccText}
                    onChange={(e) => { setBccText(e.target.value); setRecipientError(null); }}
                    onBlur={() => { void addBccFromText(); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        void addBccFromText();
                      }
                    }}
                    placeholder="Add Bcc npub or pubkey"
                    className="min-w-[180px] flex-1 bg-transparent border-none outline-none text-[13px] text-text-modal placeholder-text-placeholder"
                    disabled={isSending}
                  />
                </div>
              </div>
            )}
            {recipientError && <p className="px-5 pt-1 text-[11px] text-danger">{recipientError}</p>}

            {/* Subject field */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-modal-stroke">
              <span className="text-[12px] font-medium text-text-modal-2">Subject</span>
              <input
                type="text"
                value={draft.subject}
                onChange={(e) => updateSubject(e.target.value)}
                placeholder="Add a subject…"
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-text-modal placeholder-text-placeholder"
                disabled={isSending}
              />
            </div>

            {showPreview ? (
              <div className="flex-1 p-5 overflow-y-auto">
                <MessageBody body={draft.body || "Nothing to preview yet."} />
              </div>
            ) : (
              <div
                ref={bodyRef}
                contentEditable={!isSending}
                onInput={handleBodyInput}
                className="flex-1 p-5 text-[14px] text-text-modal outline-none overflow-y-auto whitespace-pre-wrap empty:before:content-[attr(data-placeholder)]"
                data-placeholder="Write your message…"
                suppressContentEditableWarning
              />
            )}

            {/* Attachment cards */}
            {uploads.length > 0 && (
              <div className="px-5 pb-2 flex flex-col gap-2">
                {uploads.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 h-[74px] px-3 border border-modal-stroke rounded-pill bg-modal-attach">
                    <div className="w-12 h-14 rounded-[8px] bg-pill-subtle flex items-center justify-center flex-shrink-0">
                      <span className="text-text-tertiary text-[11px] font-bold">▣</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-text-modal truncate">{u.fileName}</p>
                      <p className="text-[10px] text-text-tertiary mt-0.5">
                        {formatSize(u.sizeBytes)}
                        {u.status === "uploading" && ` · Uploading ${u.progress}%`}
                        {u.status === "uploaded" && " · Encrypted · Stored in Drive"}
                        {u.status === "failed" && ` · Failed: ${u.error}`}
                      </p>
                      {u.status === "uploading" && (
                        <div className="w-full h-[3px] bg-pill-subtle rounded-progress mt-1">
                          <div className="h-full bg-ok rounded-progress" style={{ width: `${u.progress}%` }} />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setUploads((prev) => prev.filter((x) => x.id !== u.id));
                        removeAttachment(u.fileName);
                      }}
                      className="text-text-modal-2 text-[15px] cursor-pointer hover:text-text-modal"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

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
                {draft.relayOverrides.length || relays.length} relays
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
                      checked={draft.relayOverrides.includes(relay.url)}
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
            {formatToolbar}

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
                  disabled={isSending || draft.to.length === 0}
                  className="h-10 px-5 rounded-l-[12px] bg-brand text-white text-[12px] font-semibold cursor-pointer hover:brightness-110 active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSending ? (
                    <><span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending</>
                  ) : (
                    "Send"
                  )}
                </button>
                <button
                  onClick={() => setShowSendMenu(!showSendMenu)}
                  disabled={isSending}
                  className="h-10 w-[34px] rounded-r-[12px] bg-brand text-white flex items-center justify-center cursor-pointer hover:brightness-110 active:scale-[0.97] transition-all duration-150 border-l border-white/20 disabled:opacity-40"
                >
                  <span className="text-[12px]">⌄</span>
                </button>
                {showSendMenu && (
                  <div className="absolute bottom-full left-0 mb-1 w-44 rounded-pill bg-pill-subtle border border-border shadow-lg overflow-hidden z-10">
                    <button onClick={() => { send(); setShowSendMenu(false); }} className="w-full px-4 py-2.5 text-[12px] text-text-primary text-left hover:bg-surface-active transition-colors duration-150 cursor-pointer">Send</button>
                    <button onClick={() => { setShowPreview((show) => !show); setShowSendMenu(false); }} className="w-full px-4 py-2.5 text-[12px] text-text-secondary text-left hover:bg-surface-active transition-colors duration-150 cursor-pointer">
                      {showPreview ? "Edit" : "Preview"}
                    </button>
                    <button onClick={() => { useComposeStore.getState().autosave(); setShowSendMenu(false); }} className="w-full px-4 py-2.5 text-[12px] text-text-secondary text-left hover:bg-surface-active transition-colors duration-150 cursor-pointer">Save Draft</button>
                    <button onClick={() => { requestDiscard(); setShowSendMenu(false); }} className="w-full px-4 py-2.5 text-[12px] text-danger text-left hover:bg-surface-active transition-colors duration-150 cursor-pointer">Discard</button>
                  </div>
                )}
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
              <button onClick={requestDiscard} disabled={isSending} className="text-[11px] font-medium text-danger cursor-pointer hover:brightness-110 transition-all duration-150 disabled:opacity-40">
                Discard
              </button>
            </div>
          </div>
        </div>
      </div>

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
        />
      )}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(5,7,11,0.44)" }}>
          <div className="w-[320px] rounded-[14px] border border-border bg-modal-card p-5 shadow-lg">
            <p className="text-[14px] font-semibold text-text-modal">Discard draft?</p>
            <p className="mt-2 text-[12px] text-text-modal-2">You will lose any unsaved changes.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="h-8 px-4 rounded-[10px] border border-border bg-modal-2 text-[12px] font-medium text-text-modal-2 cursor-pointer hover:brightness-110"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscard}
                className="h-8 px-4 rounded-[10px] bg-danger text-white text-[12px] font-semibold cursor-pointer hover:brightness-110"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
      <input ref={fileInputRef} type="file" multiple onChange={handleFiles} className="hidden" />
    </>
  );
}
