import type { RelayPool } from "./relays";
import type { RelayConfig } from "./types";

export async function fetchRelayList(
  pool: RelayPool,
  pubkey: string
): Promise<RelayConfig[]> {
  return new Promise((resolve) => {
    const unsub = pool.subscribe(
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
        resolve(relays);
        setTimeout(unsub, 0);
      }
    );
    setTimeout(() => {
      resolve([]);
      unsub();
    }, 5000);
  });
}

export async function fetchBlossomList(
  pool: RelayPool,
  pubkey: string
): Promise<string[]> {
  return new Promise((resolve) => {
    const unsub = pool.subscribe(
      [{ kinds: [10063], authors: [pubkey], limit: 1 }],
      (event) => {
        const servers: string[] = [];
        for (const tag of event.tags) {
          if (tag[0] === "server" && tag[1]) {
            servers.push(tag[1]);
          }
        }
        resolve(servers);
        setTimeout(unsub, 0);
      }
    );
    setTimeout(() => {
      resolve([]);
      unsub();
    }, 5000);
  });
}
