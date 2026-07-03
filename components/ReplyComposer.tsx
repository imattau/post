"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useComposeStore } from "@/lib/stores/compose";

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
  const pendingSelectionRef = useRef<number | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const open = useComposeStore((s) => s.open);

  useLayoutEffect(() => {
    if (pendingSelectionRef.current == null) return;
    const position = pendingSelectionRef.current;
    pendingSelectionRef.current = null;
    textareaRef.current?.focus();
    textareaRef.current?.setSelectionRange(position, position);
  }, [body]);

  const applyFormat = useCallback((prefix: string, suffix = "", fallback = "") => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? body.length;
    const end = textarea?.selectionEnd ?? body.length;
    const selection = body.slice(start, end);
    const content = selection || fallback;
    const insertion = `${prefix}${content}${suffix}`;
    const next = `${body.slice(0, start)}${insertion}${body.slice(end)}`;
    const nextCaret = start + insertion.length;

    pendingSelectionRef.current = nextCaret;
    setBody(next);
  }, [body]);

  const handleToolbarMouseDown = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  }, []);

  const sendReply = useCallback(async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    open({
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
    });
    try {
      await useComposeStore.getState().send();
      if (useComposeStore.getState().status === "sent") {
        setBody("");
      }
    } finally {
      setSending(false);
    }
  }, [body, messageId, open, recipientName, recipientNpub, recipientPubkey, sending, subject]);

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
    </div>
  );
}
