import type { RelayPool } from "./relays";
import type { RelayConfig } from "./types";
import { subscribeSingle } from "./utils/timeout";

export async function fetchRelayList(
  pool: RelayPool,
  pubkey: string
): Promise<RelayConfig[]> {
  return subscribeSingle(
    pool,
    [{ kinds: [10002], authors: [pubkey], limit: 1 }],
    (event) => {
      const relays: RelayConfig[] = [];
      for (const tag of event.tags) {
        if (tag[0] !== "r" || !tag[1]) continue;
        const marker = tag[2];
        relays.push({
          url: tag[1],
          read: marker !== "write",
          write: marker !== "read",
        });
      }
      return relays;
    },
    5000
  ).then((r) => r ?? []);
}

export async function fetchBlossomList(
  pool: RelayPool,
  pubkey: string
): Promise<string[]> {
  return subscribeSingle(
    pool,
    [{ kinds: [10063], authors: [pubkey], limit: 1 }],
    (event) => {
      const servers: string[] = [];
      for (const tag of event.tags) {
        if (tag[0] === "server" && tag[1]) {
          servers.push(tag[1]);
        }
      }
      return servers;
    },
    5000
  ).then((r) => r ?? []);
}
