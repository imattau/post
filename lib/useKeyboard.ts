import { useEffect } from "react";

type KeyHandler = (e: KeyboardEvent) => void;

const handlers = new Map<string, Set<KeyHandler>>();

export function useGlobalKey(key: string, handler: KeyHandler, deps: unknown[] = []) {
  useEffect(() => {
    if (!handlers.has(key)) handlers.set(key, new Set());
    handlers.get(key)!.add(handler);

    const listener = (e: KeyboardEvent) => {
      if (e.key === key && !e.repeat) {
        const h = handlers.get(key);
        if (h) for (const cb of h) cb(e);
      }
    };

    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
      handlers.get(key)?.delete(handler);
    };
  }, deps);
}

export function useKeyboardNav(
  itemIds: string[],
  selectedId: string | null,
  onSelect: (id: string) => void,
  deps: unknown[] = []
) {
  useEffect(() => {
    if (itemIds.length === 0) return;

    const listener = (e: KeyboardEvent) => {
      const idx = selectedId ? itemIds.indexOf(selectedId) : -1;
      let next = idx;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        next = Math.min(idx + 1, itemIds.length - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        next = Math.max(idx - 1, 0);
      } else {
        return;
      }

      if (next >= 0 && next < itemIds.length && next !== idx) {
        onSelect(itemIds[next]);
      }
    };

    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [itemIds.join(","), selectedId, ...deps]);
}
