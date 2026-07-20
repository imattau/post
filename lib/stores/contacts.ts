import { create } from "zustand";
import { graph, putNode, putNodes, getNodes, clearNodes, contactSearchText } from "@/lib/db/poly";
import { npubEncode } from "nostr-tools/nip19";
import { fetchContactList, batchFetchProfiles } from "@post/nostr-core";
import { useRelaysStore } from "@/lib/stores/relays";
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

const AVATAR_COLORS = [
  "var(--color-avatar-1)", "var(--color-avatar-2)", "var(--color-avatar-3)",
  "var(--color-avatar-4)", "var(--color-avatar-5)", "var(--color-avatar-6)",
  "var(--color-avatar-7)",
];

function pickColor(name: string): string {
  const hash = Math.abs(name.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0));
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface ContactsState {
  contacts: ContactView[];
  loading: boolean;
  loadContacts: () => Promise<void>;
  fetchNostrContacts: () => Promise<void>;
  setStatus: (id: string, status: ContactStatus) => Promise<void>;
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  loading: false,

  async loadContacts() {
    const stored = await getNodes<any>('contact');
    if (stored.length === 0) return;
    set({
      contacts: stored.map((contact) => ({
        id: contact.pubkey,
        pubkey: contact.pubkey,
        npub: contact.npub,
        name: contact.name,
        about: contact.about || "",
        picture: contact.picture || "",
        nip05: contact.nip05 || "",
        nip05Verified: contact.nip05Verified,
        lastMessageAt: contact.lastMessageAt,
        relayRecommended: contact.relayRecommended || "",
        initials: contact.name.slice(0, 2).toUpperCase(),
        handle: contact.nip05 ? `@${contact.nip05.split("@")[0]}` : `@${contact.name.toLowerCase().replace(/\s+/g, "")}`,
        bio: contact.about || "",
        status: ((contact as ContactView).status ?? "Following") as ContactStatus,
        timestamp: contact.lastMessageAt ? new Date(contact.lastMessageAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
        color: pickColor(contact.name),
      })),
    });
  },

  async fetchNostrContacts() {
    const pool = useRelaysStore.getState().pool;
    if (!pool) return;

    set({ loading: true });

    const myPubkey = (await (await import("@/lib/stores/identity")).useIdentityStore.getState().identity)?.pubkey;
    if (!myPubkey) {
      set({ loading: false });
      return;
    }

    const pubkeys = await fetchContactList(pool, myPubkey);
    if (pubkeys.length === 0) {
      set({ loading: false });
      return;
    }

    const profileMap = await batchFetchProfiles(pool, pubkeys);

    const existing = get().contacts;
    const existingByPubkey = new Map(existing.map((c) => [c.pubkey, c]));

    const contacts: ContactView[] = pubkeys.map((pubkey) => {
      const existingContact = existingByPubkey.get(pubkey);
      const profile = profileMap.get(pubkey);
      const name = profile?.name || profile?.displayName || existingContact?.name || pubkey.slice(0, 8);
      const nip05 = profile?.nip05 || existingContact?.nip05 || "";
      const picture = profile?.picture || existingContact?.picture || "";
      const about = profile?.about || existingContact?.about || "";

      return {
        id: pubkey,
        pubkey,
        npub: npubEncode(pubkey),
        name,
        about,
        picture,
        nip05,
        nip05Verified: existingContact?.nip05Verified ?? false,
        lastMessageAt: existingContact?.lastMessageAt ?? 0,
        relayRecommended: existingContact?.relayRecommended || "",
        initials: name.slice(0, 2).toUpperCase(),
        handle: nip05 ? `@${nip05.split("@")[0]}` : `@${name.toLowerCase().replace(/\s+/g, "")}`,
        bio: about,
        status: (existingContact?.status ?? "Following") as ContactStatus,
        timestamp: existingContact?.lastMessageAt ? new Date(existingContact.lastMessageAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
        color: pickColor(name),
      };
    });

    await clearNodes('contact');
    await putNodes(contacts.map((c: any) => ({
      type: 'contact',
      id: c.pubkey ?? c.id,
      data: c as any,
      searchText: contactSearchText(c as any),
    })));
    set({ contacts, loading: false });
  },

  async setStatus(id, status) {
    const contacts = get().contacts.map((contact) => contact.id === id ? { ...contact, status } : contact);
    set({ contacts });
    const contact = contacts.find((item) => item.id === id);
    if (contact) {
      await putNode('contact', contact.pubkey ?? contact.id, contact as any, contactSearchText(contact as any));
    }
  },
}));
