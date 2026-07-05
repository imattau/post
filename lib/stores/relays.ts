import { create } from "zustand";
import { createRelayPool, DEFAULT_RELAYS, fetchRelayList } from "@post/nostr-core";
import type { RelayPool } from "@post/nostr-core";
import { db } from "@/lib/db/schema";
import { useSettingsStore } from "@/lib/stores/settings";
import type { RelayConfig, RelayStatus } from "@/lib/types";

interface RelaysState {
  relays: RelayConfig[];
  statuses: Record<string, RelayStatus>;
  healthPercent: number;
  syncedAgo: number;
  pool: RelayPool | null;
  connected: boolean;
  addRelay: (config: RelayConfig) => void;
  removeRelay: (url: string) => void;
  loadRelayConfigs: () => Promise<void>;
  loadRelayListFromNostr: (pubkey: string) => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateStatuses: () => Promise<void>;
}

export const useRelaysStore = create<RelaysState>((set, get) => ({
  relays: DEFAULT_RELAYS,
  statuses: {},
  healthPercent: 0,
  syncedAgo: 0,
  pool: null,
  connected: false,

  addRelay: (config: RelayConfig) => {
    set((state) => ({ relays: [...state.relays, config] }));
    void db.relayConfigs.put(config);
  },

  removeRelay: (url: string) => {
    set((state) => ({ relays: state.relays.filter((r) => r.url !== url) }));
    void db.relayConfigs.delete(url);
  },

  loadRelayConfigs: async () => {
    const saved = await db.relayConfigs.toArray();
    if (saved.length > 0) set({ relays: saved });
  },

  loadRelayListFromNostr: async (pubkey: string) => {
    const { pool, relays } = get();
    if (!pool) return;

    const enabled = useSettingsStore.getState().values["use-nostr-relay-list"];
    if (!enabled) return;

    const nostrRelays = await fetchRelayList(pool, pubkey);
    if (nostrRelays.length === 0) return;

    const merged = [...relays];
    for (const nr of nostrRelays) {
      if (!merged.some((r) => r.url === nr.url)) {
        merged.push(nr);
      }
    }

    set({ relays: merged });
    await db.relayConfigs.clear();
    await db.relayConfigs.bulkAdd(merged);
  },

  connect: async () => {
    const { relays } = get();
    const pool = createRelayPool(relays);
    await pool.connectAll();
    const statuses = pool.getStatus();
    const statusMap: Record<string, RelayStatus> = {};
    for (const s of statuses) statusMap[s.url] = s;
    set({
      pool,
      statuses: statusMap,
      healthPercent: pool.getHealthPercent(),
      syncedAgo: pool.getSyncedAgo(),
      connected: true,
    });
  },

  disconnect: () => {
    const { pool } = get();
    pool?.disconnectAll();
    set({ pool: null, statuses: {}, healthPercent: 0, syncedAgo: 0, connected: false });
  },

  updateStatuses: async () => {
    const { pool } = get();
    if (!pool) return;
    const statuses = pool.getStatus();
    const statusMap: Record<string, RelayStatus> = {};
    for (const s of statuses) statusMap[s.url] = s;
    set({
      statuses: statusMap,
      healthPercent: pool.getHealthPercent(),
      syncedAgo: pool.getSyncedAgo(),
    });
  },
}));
