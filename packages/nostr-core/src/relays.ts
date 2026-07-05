import { SimplePool } from "nostr-tools/pool";
import type { Filter } from "nostr-tools/filter";
import type { Event } from "nostr-tools/core";
import type { RelayConfig, RelayStatus } from "./types";

export const DEFAULT_RELAYS: RelayConfig[] = [
  { url: "wss://relay.damus.io", read: true, write: true },
  { url: "wss://relay.nostr.band", read: true, write: true },
  { url: "wss://nos.lol", read: true, write: true },
  { url: "wss://relay.snort.social", read: true, write: true },
  { url: "wss://purplepag.es", read: true, write: false },
];

export interface RelayPool {
  connectAll(): Promise<void>;
  disconnectAll(): void;
  getStatus(): RelayStatus[];
  subscribe(filters: Filter[], cb: (event: Event) => void): () => void;
  publish(event: Event, targetRelays?: string[]): Promise<Map<string, boolean>>;
  getHealthPercent(): number;
  getSyncedAgo(): number;
}

export function createRelayPool(relays: RelayConfig[]): RelayPool {
  const simplePool = new SimplePool({
    enablePing: true,
    enableReconnect: true,
  });

  const connected = new Map<string, boolean>();
  const latencies = new Map<string, number>();
  const lastEventAtByRelay = new Map<string, number>();
  let lastEventAt = Date.now();
  const errors = new Map<string, string | null>();

  const readUrls = relays.filter((r) => r.read).map((r) => r.url);
  const writeUrls = relays.filter((r) => r.write).map((r) => r.url);
  const allUrls = relays.map((r) => r.url);

  return {
    async connectAll(): Promise<void> {
      await Promise.allSettled(
        allUrls.map(async (url) => {
          const start = performance.now();
          try {
            await simplePool.ensureRelay(url, { connectionTimeout: 4000 });
            const latency = Math.round(performance.now() - start);
            connected.set(url, true);
            latencies.set(url, latency);
            errors.set(url, null);
          } catch (err) {
            connected.set(url, false);
            latencies.set(url, -1);
            errors.set(url, err instanceof Error ? err.message : "Connection failed");
          }
        })
      );
    },

    disconnectAll(): void {
      simplePool.destroy();
      connected.clear();
      latencies.clear();
      errors.clear();
    },

    getStatus(): RelayStatus[] {
      return allUrls.map((url) => ({
        url,
        connected: connected.get(url) ?? false,
        latency: latencies.get(url) ?? -1,
        lastEventAt: lastEventAtByRelay.get(url) ?? 0,
        error: errors.get(url) ?? null,
      }));
    },

    subscribe(filters: Filter[], cb: (event: Event) => void): () => void {
      const closers = filters.map((filter) =>
        simplePool.subscribeMany(
          readUrls,
          filter,
          {
            onevent(event: Event) {
              lastEventAt = Date.now();
              cb(event);
            },
          }
        )
      );
      return () => closers.forEach((c) => c.close());
    },

    async publish(event: Event, targetRelays?: string[]): Promise<Map<string, boolean>> {
      const urls = targetRelays ?? writeUrls;
      const results = new Map<string, boolean>();
      const promises = simplePool.publish(urls, event);
      for (let i = 0; i < urls.length; i++) {
        try {
          await promises[i];
          results.set(urls[i], true);
        } catch {
          results.set(urls[i], false);
        }
      }
      return results;
    },

    getHealthPercent(): number {
      if (allUrls.length === 0) return 0;
      const connectedCount = allUrls.filter((u) => connected.get(u)).length;
      return Math.round((connectedCount / allUrls.length) * 100);
    },

    getSyncedAgo(): number {
      return Math.round((Date.now() - lastEventAt) / 1000);
    },
  };
}
