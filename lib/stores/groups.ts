import { create } from "zustand";
import { generateSecretKey, getPublicKey } from "nostr-tools/pure";
import { nip17 } from "nostr-tools";
import type { GroupInbox, RecipientEntry } from "@post/nostr-core";
import { graph, putNode, getNodes, addEdge, EDGE } from "@/lib/db/poly";

interface GroupsState {
  byConversationId: Record<string, GroupInbox>;
  byPubkey: Record<string, GroupInbox>;
  loaded: boolean;
  loadFromCache: () => Promise<void>;
  getGroupInbox: (conversationId: string) => GroupInbox | null;
  createGroupInbox: (conversationId: string, members: RecipientEntry[]) => GroupInbox;
  saveReceivedGroupKey: (conversationId: string, pubkey: string, privkeyHex: string, members: RecipientEntry[]) => Promise<void>;
  getAllGroupPubkeys: () => string[];
  tryDecrypt: (event: { content: string; tags: string[][] }) => { rumor: { id: string; kind: number; pubkey: string; content: string; created_at: number; tags: string[][] } } | null;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}

export const useGroupsStore = create<GroupsState>((set, get) => ({
  byConversationId: {},
  byPubkey: {},
  loaded: false,

  async loadFromCache() {
    const rows = await getNodes<GroupInbox>('group_inbox');
    const byConversationId: Record<string, GroupInbox> = {};
    const byPubkey: Record<string, GroupInbox> = {};
    for (const g of rows) {
      byConversationId[g.id] = g;
      byPubkey[g.pubkey] = g;
    }
    set({ byConversationId, byPubkey, loaded: true });
  },

  getGroupInbox: (conversationId: string) => {
    return get().byConversationId[conversationId] ?? null;
  },

  createGroupInbox: (conversationId: string, members: RecipientEntry[]) => {
    const existing = get().byConversationId[conversationId];
    if (existing) return existing;
    const sk = generateSecretKey();
    const pubkey = getPublicKey(sk);
    const privkeyHex = Buffer.from(sk).toString("hex");
    const inbox: GroupInbox = { id: conversationId, pubkey, privkey: privkeyHex, members, createdAt: Date.now() };
    putNode('group_inbox', conversationId, inbox as any);
    for (const member of members) {
      addEdge(conversationId, EDGE.HAS_MEMBER, member.pubkey);
    }
    set({
      byConversationId: { ...get().byConversationId, [conversationId]: inbox },
      byPubkey: { ...get().byPubkey, [pubkey]: inbox },
    });
    return inbox;
  },

  async saveReceivedGroupKey(conversationId: string, pubkey: string, privkeyHex: string, members: RecipientEntry[]) {
    const inbox: GroupInbox = { id: conversationId, pubkey, privkey: privkeyHex, members, createdAt: Date.now() };
    await putNode('group_inbox', conversationId, inbox as any);
    for (const member of members) {
      await addEdge(conversationId, EDGE.HAS_MEMBER, member.pubkey);
    }
    set({
      byConversationId: { ...get().byConversationId, [conversationId]: inbox },
      byPubkey: { ...get().byPubkey, [pubkey]: inbox },
    });
  },

  getAllGroupPubkeys: () => {
    return Object.keys(get().byPubkey);
  },

  tryDecrypt(event) {
    const groups = get().byPubkey;
    if (Object.keys(groups).length === 0) return null;

    for (const group of Object.values(groups)) {
      if (!group) continue;
      try {
        const sk = hexToBytes(group.privkey);
        const rumor = nip17.unwrapEvent(event as any, sk) as unknown as { id: string; kind: number; pubkey: string; content: string; created_at: number; tags: string[][] };
        return { rumor };
      } catch {
        continue;
      }
    }
    return null;
  },
}));
