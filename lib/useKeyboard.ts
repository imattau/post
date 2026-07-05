import { useHotkeys } from "react-hotkeys-hook";
import { useCallback } from "react";

export function useGlobalKey(key: string, handler: (e: KeyboardEvent) => void, deps: unknown[] = []) {
  useHotkeys(key, handler, { preventDefault: true, keydown: true }, deps as any[]);
}

export function useKeyboardNav(
  itemIds: string[],
  selectedId: string | null,
  onSelect: (id: string) => void,
  deps: unknown[] = []
) {
  const onArrowDown = useCallback(() => {
    const idx = selectedId ? itemIds.indexOf(selectedId) : -1;
    if (idx < itemIds.length - 1) onSelect(itemIds[idx + 1]);
  }, [itemIds, selectedId, onSelect]);

  const onArrowUp = useCallback(() => {
    const idx = selectedId ? itemIds.indexOf(selectedId) : -1;
    if (idx > 0) onSelect(itemIds[idx - 1]);
  }, [itemIds, selectedId, onSelect]);

  useHotkeys("ArrowDown", onArrowDown, { preventDefault: true }, [itemIds, selectedId, onSelect]);
  useHotkeys("ArrowUp", onArrowUp, { preventDefault: true }, [itemIds, selectedId, onSelect]);
}
