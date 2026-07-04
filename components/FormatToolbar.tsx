"use client";

import { useCallback, useRef } from "react";
import { Link2, Paperclip, SmilePlus } from "lucide-react";

interface FormatToolbarProps {
  onFormat: (prefix: string, suffix?: string, fallback?: string) => void;
  onAttach: () => void;
  showMarkdownLabel?: boolean;
  children?: React.ReactNode;
}

export default function FormatToolbar({ onFormat, onAttach, showMarkdownLabel, children }: FormatToolbarProps) {
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="flex items-center gap-0.5 px-5 py-1.5 border-t border-modal-stroke">
      <button
        onMouseDown={handleMouseDown}
        onClick={() => onFormat("**", "**")}
        className="w-7 h-7 flex items-center justify-center text-text-modal-2 text-[13px] font-semibold rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150"
        aria-label="Bold"
      >
        B
      </button>
      <button
        onMouseDown={handleMouseDown}
        onClick={() => onFormat("_", "_")}
        className="w-7 h-7 flex items-center justify-center text-text-modal-2 text-[13px] font-medium italic rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150"
        aria-label="Italic"
      >
        I
      </button>
      <button
        onMouseDown={handleMouseDown}
        onClick={() => onFormat("[", "](url)", "text")}
        className="w-7 h-7 flex items-center justify-center text-text-modal-2 rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150"
        aria-label="Insert link"
      >
        <Link2 size={13} />
      </button>
      <button
        onClick={onAttach}
        className="w-7 h-7 flex items-center justify-center text-text-modal-2 rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150"
        aria-label="Attach file"
      >
        <Paperclip size={13} />
      </button>
      <button
        onMouseDown={handleMouseDown}
        onClick={() => onFormat("☺")}
        className="w-7 h-7 flex items-center justify-center text-text-modal-2 rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150"
        aria-label="Insert emoji"
      >
        <SmilePlus size={13} />
      </button>
      {showMarkdownLabel && (
        <span className="text-[10px] text-text-placeholder ml-auto">Markdown supported</span>
      )}
      {children}
    </div>
  );
}
