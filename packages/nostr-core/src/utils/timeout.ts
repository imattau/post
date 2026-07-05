import type { RelayPool } from "../relays";

export const SKIP = Symbol("skip");

export function subscribeSingle<T>(
  pool: RelayPool,
  filters: any[],
  onEvent: (event: any) => T | typeof SKIP,
  timeoutMs: number = 5000
): Promise<T | null> {
  return new Promise<T | null>((resolve) => {
    const unsub = pool.subscribe(filters, (event) => {
      const result = onEvent(event);
      if (result !== SKIP) {
        resolve(result);
        setTimeout(unsub, 0);
      }
    });
    setTimeout(() => { resolve(null); unsub(); }, timeoutMs);
  });
}

export function subscribeAccumulate<T>(
  pool: RelayPool,
  filters: any[],
  onEvent: (event: any, acc: T[]) => void,
  timeoutMs: number = 5000
): Promise<T[]> {
  return new Promise<T[]>((resolve) => {
    const results: T[] = [];
    const unsub = pool.subscribe(filters, (event) => {
      onEvent(event, results);
    });
    setTimeout(() => { resolve(results); unsub(); }, timeoutMs);
  });
}
