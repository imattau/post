"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { useComposeStore } from "@/lib/stores/compose";
import { useSettingsStore } from "@/lib/stores/settings";
import { wrapTextareaSelection } from "@/lib/utils";
import TextareaAutosize from "react-textarea-autosize";
import FormatToolbar from "./FormatToolbar";

export default function ReplyComposer({
  recipientName,
  recipientPubkey,
  recipientNpub,
  messageId,
  subject,
  messageBody,
}: {
  recipientName: string;
  recipientPubkey: string;
  recipientNpub: string;
  messageId: string;
  subject: string;
  messageBody?: string;
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

  const replyDraft = useCallback(() => {
    const quoteOriginal = (useSettingsStore.getState().values["quote-original-post"] ?? false) as boolean;
    const trimmed = body.trim();
    const finalBody = quoteOriginal && messageBody
      ? `> ${messageBody.replace(/\n/g, "\n> ")}\n\n${trimmed}`
      : trimmed;
    return {
      to: [{
        pubkey: recipientPubkey,
        npub: recipientNpub,
        name: recipientName,
        avatarUrl: "",
        isGroup: false,
      }],
      subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
      body: finalBody,
      replyTo: messageId,
    };
  }, [body, messageId, messageBody, recipientName, recipientNpub, recipientPubkey, subject]);

  const handleExpand = useCallback(() => {
    open(replyDraft());
  }, [open, replyDraft]);

  const sendReply = useCallback(async () => {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const draft = replyDraft();
      const ok = await useComposeStore.getState().sendDirect(draft.to, draft.subject, draft.body, draft.replyTo);
      if (ok) {
        setBody("");
      }
    } finally {
      setSending(false);
    }
  }, [body, sending, replyDraft]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void sendReply();
    }
    if (e.key === "Escape" && !body.trim()) {
      (e.target as HTMLTextAreaElement).blur();
    }
  }, [body, sendReply]);

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
      <div className="rounded-pill border border-border bg-sidebar flex flex-col">
        <TextareaAutosize
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={`Reply to ${recipientName}`}
          placeholder={`Reply to ${recipientName}…`}
          minRows={2}
          maxRows={12}
          className="min-h-[66px] resize-none bg-transparent px-5 pt-[18px] pb-2 text-[13px] text-text-primary placeholder-text-placeholder outline-none overflow-hidden"
          disabled={sending}
        />
        <div className="mx-5 h-px bg-border" />
        <div className="flex h-[63px] items-center gap-1 px-5">
          <FormatToolbar onFormat={applyFormat} onAttach={handleAttach}>
            <button
              type="button"
              aria-label="Open in full compose"
              onClick={handleExpand}
              className="flex h-7 w-7 items-center justify-center rounded text-text-secondary transition-colors duration-150 hover:bg-pill-subtle cursor-pointer"
            >
              <Maximize2 size={13} />
            </button>
          </FormatToolbar>
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
