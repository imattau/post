"use client";

import { memo } from "react";
import { useComposeStore } from "@/lib/stores/compose";

export interface RecipientRowProps {
  label: string;
  recipients: { pubkey: string; name: string }[];
  text: string;
  onTextChange: (value: string) => void;
  onAdd: () => void;
  placeholder: string;
}

export const RecipientRow = memo(function RecipientRow({
  label,
  recipients,
  text,
  onTextChange,
  onAdd,
  placeholder,
}: RecipientRowProps) {
  const isSending = useComposeStore((s) => s.status === "sending");

  return (
    <div className="flex items-start gap-3 px-5 py-2 border-b border-modal-stroke">
      <span className="text-[12px] font-medium text-text-modal-2 pt-1">{label}</span>
      <div className="flex-1 flex flex-wrap items-center gap-1.5">
        {recipients.map((r) => (
          <span
            key={r.pubkey}
            className="h-7 px-2.5 rounded-pill bg-pill-subtle border border-modal-stroke text-text-modal-2 text-[12px] font-medium leading-[26px]"
          >
            {r.name}
          </span>
        ))}
        <input
          type="text"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          onBlur={onAdd}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className="min-w-[180px] flex-1 bg-transparent border-none outline-none text-[13px] text-text-modal placeholder-text-placeholder"
          disabled={isSending}
        />
      </div>
    </div>
  );
});
