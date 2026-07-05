"use client";

import { memo, useCallback, useState, useRef, useEffect } from "react";
import { Link2, Paperclip, SmilePlus } from "lucide-react";

const EMOJIS = [
  "😀", "😂", "😊", "😍", "🤔", "😎", "🙌", "👍", "👎", "❤️",
  "🔥", "💯", "🎉", "✨", "🚀", "💡", "📌", "🎯", "💪", "🤝",
  "😢", "😡", "🥳", "😴", "🤗", "👀", "🗣️", "💬", "📧", "🔒",
];

export default memo(function FormatToolbar({
  onFormat,
  onAttach,
  showMarkdownLabel,
  children,
}: {
  onFormat: (prefix: string, suffix?: string, fallback?: string) => void;
  onAttach: () => void;
  showMarkdownLabel?: boolean;
  children?: React.ReactNode;
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showEmojiPicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  }, []);

  const handleEmojiClick = useCallback((emoji: string) => {
    onFormat(emoji);
    setShowEmojiPicker(false);
  }, [onFormat]);

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
      <div className="relative" ref={emojiRef}>
        <button
          onMouseDown={handleMouseDown}
          onClick={() => setShowEmojiPicker((show) => !show)}
          className="w-7 h-7 flex items-center justify-center text-text-modal-2 rounded hover:bg-pill-subtle cursor-pointer transition-colors duration-150"
          aria-label="Insert emoji"
        >
          <SmilePlus size={13} />
        </button>
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-1 z-20 w-[232px] rounded-[10px] border border-border bg-modal-card shadow-lg p-2">
            <div className="grid grid-cols-6 gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onMouseDown={handleMouseDown}
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-[16px] rounded hover:bg-surface-active cursor-pointer transition-colors duration-150"
                  aria-label={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {showMarkdownLabel && (
        <span className="text-[10px] text-text-placeholder ml-auto">Markdown supported</span>
      )}
      {children}
    </div>
  );
});
