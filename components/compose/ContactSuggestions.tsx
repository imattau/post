"use client";

import { memo, useMemo, useState, useEffect } from "react";
import { Command, useCommandState } from "cmdk";
import { useContactsStore } from "@/lib/stores/contacts";
import { searchContacts } from "@/lib/search";

export const ContactSuggestions = memo(function ContactSuggestions({
  recipientText,
  onSelect,
  highlightedRef,
}: {
  recipientText: string;
  onSelect: (contact: ReturnType<typeof useContactsStore.getState>["contacts"][number]) => void;
  highlightedRef: React.RefObject<boolean>;
}) {
  const contacts = useContactsStore((s) => s.contacts);
  const [vectorResults, setVectorResults] = useState<any[]>([]);
  const selectedItemId = useCommandState((state) => state.selectedItemId);

  highlightedRef.current = !!selectedItemId;

  useEffect(() => {
    if (!recipientText.trim()) {
      setVectorResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const nodes = await searchContacts(recipientText, 6);
      setVectorResults(nodes.map((n: any) => n.data ?? n));
    }, 150);
    return () => clearTimeout(timer);
  }, [recipientText]);

  const suggestions = useMemo(() => {
    if (!recipientText.trim()) {
      return [...contacts]
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
        .slice(0, 6);
    }
    if (vectorResults.length > 0) return vectorResults;
    // fallback: filter locally while vector search is in flight
    const q = recipientText.toLowerCase();
    return contacts
      .filter((c) => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q))
      .slice(0, 6);
  }, [contacts, recipientText, vectorResults]);

  if (suggestions.length === 0) return null;

  return (
    <div className="absolute left-0 top-full mt-1 w-full z-20">
      <Command.List className="rounded-[10px] border border-border bg-modal-card shadow-lg overflow-hidden p-0">
        {suggestions.map((contact) => (
          <Command.Item
            key={contact.id}
            value={contact.id}
            onSelect={() => onSelect(contact)}
            className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-active data-[highlighted]:bg-surface-active transition-colors duration-150 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: contact.color }}>
              <span className="text-white text-[10px] font-semibold">{contact.initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[12px] font-medium text-text-modal truncate block">{contact.name}</span>
              <span className="text-[10px] text-text-tertiary truncate block">{contact.handle}</span>
            </div>
          </Command.Item>
        ))}
      </Command.List>
    </div>
  );
});
