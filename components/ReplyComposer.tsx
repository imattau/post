"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useComposeStore } from "@/lib/stores/compose";
import { wrapTextareaSelection } from "@/lib/utils";

export default function ReplyComposer({
  recipientName,
  recipientPubkey,
  recipientNpub,
  messageId,
  subject,
}: {
  recipientName: string;
  recipientPubkey: string;
  recipientNpub: string;
  messageId: string;
  subject: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSelectionRef = useRef<number | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const open = useComposeStore((s) => s.open);
  const addAttachment = useComposeStore((s) => s.addAttachment);

  useLayoutEffect(() => {
    if (pendingSelectionRef.current == null) return;
    const position = pendingSelectionRef.current;
    pendingSelectionRef.current = null;
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(position, position);
  }, [body]);

  const applyFormat = useCallback((prefix: string, suffix = "", fallback = "") => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart ?? body.length;
    const selection = body.slice(start, textareaRef.current.selectionEnd ?? body.length);
    const content = selection || fallback;
    const next = wrapTextareaSelection(textareaRef.current, prefix, suffix, body, fallback);
    const nextCaret = start + prefix.length + content.length + suffix.length;

    pendingSelectionRef.current = nextCaret;
    setBody(next);
  }, [body]);

  const handleToolbarMouseDown = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  }, []);

  const replyDraft = useCallback(() => ({
    to: [{
      pubkey: recipientPubkey,
      npub: recipientNpub,
      name: recipientName,
      avatarUrl: "",
      isGroup: false,
    }],
    subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
    body: body.trim(),
    replyTo: messageId,
  }), [body, messageId, recipientName, recipientNpub, recipientPubkey, subject]);

  const handleExpand = useCallback(() => {
    open(replyDraft());
  }, [open, replyDraft]);

  const sendReply = useCallback(async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    open(replyDraft());
    try {
      await useComposeStore.getState().send();
      if (useComposeStore.getState().status === "sent") {
        setBody("");
      }
    } finally {
      setSending(false);
    }
  }, [body.trim(), sending, open, replyDraft]);

  const handleAttach = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    for (const file of files) {
      addAttachment(file);
    }
    open(replyDraft());
    if (e.target) e.target.value = "";
  }, [addAttachment, open, replyDraft]);

  return (
    <div className="mx-10 mb-11 mt-2 w-[560px] max-w-[calc(100%-80px)]">
      <p className="mb-[17px] text-[14px] font-medium text-text-near-white">{recipientName}</p>
      <div className="h-[130px] rounded-pill border border-border bg-sidebar flex flex-col">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-label={`Reply to ${recipientName}`}
          placeholder={`Reply to ${recipientName}…`}
          className="h-[66px] min-h-0 flex-none resize-none bg-transparent px-5 pt-[18px] pb-2 text-[13px] text-text-primary placeholder-text-placeholder outline-none"
          disabled={sending}
        />
        <div className="mx-5 h-px bg-border" />
        <div className="flex h-[63px] items-center gap-1 px-5">
          <button
            type="button"
            aria-label="Bold"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => applyFormat("**", "**")}
            className="flex h-7 w-7 items-center justify-center rounded text-[13px] font-semibold text-text-secondary transition-colors duration-150 hover:bg-pill-subtle cursor-pointer"
          >
            B
          </button>
          <button
            type="button"
            aria-label="Italic"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => applyFormat("_", "_")}
            className="flex h-7 w-7 items-center justify-center rounded text-[13px] font-semibold text-text-secondary transition-colors duration-150 hover:bg-pill-subtle cursor-pointer"
          >
            I
          </button>
          <button
            type="button"
            aria-label="Insert link"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => applyFormat("[", "](url)", "text")}
            className="flex h-7 w-7 items-center justify-center rounded text-[13px] font-semibold text-text-secondary transition-colors duration-150 hover:bg-pill-subtle cursor-pointer"
          >
            ⌁
          </button>
          <button
            type="button"
            aria-label="Insert emoji"
            onMouseDown={handleToolbarMouseDown}
            onClick={() => applyFormat("☺")}
            className="flex h-7 w-7 items-center justify-center rounded text-[13px] font-semibold text-text-secondary transition-colors duration-150 hover:bg-pill-subtle cursor-pointer"
          >
            ☺
          </button>
          <button
            type="button"
            aria-label="Attach file"
            onClick={handleAttach}
            className="flex h-7 w-7 items-center justify-center rounded text-[13px] font-semibold text-text-secondary transition-colors duration-150 hover:bg-pill-subtle cursor-pointer"
          >
            ▣
          </button>
          <button
            type="button"
            aria-label="Open in full compose"
            onClick={handleExpand}
            className="flex h-7 w-7 items-center justify-center rounded text-[13px] font-semibold text-text-secondary transition-colors duration-150 hover:bg-pill-subtle cursor-pointer"
          >
            ↗
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => { void sendReply(); }}
            disabled={!body.trim() || sending}
            className="h-[34px] w-[90px] rounded-[10px] bg-brand text-white text-[12px] font-semibold cursor-pointer hover:brightness-110 active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? "Sending" : "Send"}
          </button>
        </div>
      </div>
      <input ref={fileInputRef} type="file" multiple onChange={handleFiles} className="hidden" />
    </div>
  );
}
