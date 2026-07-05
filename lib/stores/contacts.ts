import { create } from "zustand";
import { db } from "@/lib/db/schema";
import type { Contact } from "@/lib/types";

export type ContactStatus = "Following" | "Muted" | "Blocked";

export interface ContactView extends Contact {
  id: string;
  initials: string;
  handle: string;
  bio: string;
  status: ContactStatus;
  timestamp: string;
  color: string;
}

const SEED_CONTACTS: ContactView[] = [
  { id: "1", pubkey: "alice", initials: "AL", name: "Alice Nguyen", handle: "@alice", npub: "npub1alice…x9k2", bio: "Designer · Melbourne", about: "Designer · Melbourne", picture: "", nip05: "", nip05Verified: false, lastMessageAt: Date.now(), relayRecommended: "", status: "Following", timestamp: "Today", color: "var(--color-avatar-1)" },
  { id: "2", pubkey: "jonas", initials: "JB", name: "Jonas Berg", handle: "@jonas", npub: "npub1jonas…m4p8", bio: "Relay developer · Oslo", about: "Relay developer · Oslo", picture: "", nip05: "", nip05Verified: false, lastMessageAt: Date.now() - 86_400_000, relayRecommended: "", status: "Following", timestamp: "Yesterday", color: "var(--color-avatar-2)" },
  { id: "3", pubkey: "noise", initials: "NW", name: "Noise Watch", handle: "@noisewatch", npub: "npub1noise…j7h4", bio: "Photographer · Seoul", about: "Photographer · Seoul", picture: "", nip05: "", nip05Verified: false, lastMessageAt: Date.now(), relayRecommended: "", status: "Following", timestamp: "Friday", color: "var(--color-avatar-5)" },
  { id: "4", pubkey: "spam", initials: "SP", name: "Spam Account", handle: "@fastprofit", npub: "npub1spam…z6n1", bio: "Product strategist · Madrid", about: "Product strategist · Madrid", picture: "", nip05: "", nip05Verified: false, lastMessageAt: Date.now(), relayRecommended: "", status: "Following", timestamp: "Thursday", color: "var(--color-avatar-4)" },
  { id: "5", pubkey: "relay", initials: "RM", name: "Relay Monitor", handle: "@relaymon", npub: "npub1relay…h7j3", bio: "Automated service identity", about: "Automated service identity", picture: "", nip05: "", nip05Verified: false, lastMessageAt: Date.now(), relayRecommended: "", status: "Following", timestamp: "Wednesday", color: "var(--color-avatar-6)" },
];

interface ContactsState {
  contacts: ContactView[];
  loadContacts: () => Promise<void>;
  setStatus: (id: string, status: ContactStatus) => Promise<void>;
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: SEED_CONTACTS,

  async loadContacts() {
    const stored = await db.contacts.toArray();
    if (stored.length === 0) {
      await db.contacts.bulkPut(SEED_CONTACTS);
      set({ contacts: SEED_CONTACTS });
      return;
    }
    set({
      contacts: stored.map((contact, index) => ({
        ...SEED_CONTACTS[index % SEED_CONTACTS.length],
        ...contact,
        id: contact.pubkey,
        initials: contact.name.slice(0, 2).toUpperCase(),
        handle: contact.nip05 ? `@${contact.nip05.split("@")[0]}` : `@${contact.name.toLowerCase().replace(/\s+/g, "")}`,
        bio: contact.about,
        status: ((contact as ContactView).status ?? "Following") as ContactStatus,
        timestamp: contact.lastMessageAt ? new Date(contact.lastMessageAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
        color: SEED_CONTACTS[index % SEED_CONTACTS.length].color,
      })),
    });
  },

  async setStatus(id, status) {
    const contacts = get().contacts.map((contact) => contact.id === id ? { ...contact, status } : contact);
    set({ contacts });
    const contact = contacts.find((item) => item.id === id);
    if (contact) {
      await db.contacts.put(contact);
    }
  },
}));
