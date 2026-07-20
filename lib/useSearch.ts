import { useState, useMemo, useCallback } from "react";
import { useDebounce } from "use-debounce";

export function useSearch<T extends { id: string }>({
  items,
  searchFn,
  debounceMs = 200,
  minQueryLength = 1,
}: {
  items: T[];
  searchFn: (query: string, items: T[]) => any[];
  debounceMs?: number;
  minQueryLength?: number;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, debounceMs);

  const results = useMemo(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < minQueryLength) return items;
    const searchResults = searchFn(debouncedQuery, items);
    const resultMap = new Map(searchResults.map((r, i) => [r.id, i]));
    return items
      .filter((item) => resultMap.has(item.id))
      .sort((a, b) => {
        const ia = resultMap.get(a.id) ?? Infinity;
        const ib = resultMap.get(b.id) ?? Infinity;
        return ia - ib;
      });
  }, [debouncedQuery, items, searchFn, minQueryLength]);

  const clear = useCallback(() => {
    setQuery("");
  }, []);

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    clear,
    isSearching: query !== debouncedQuery,
  };
}

export function useSearchSimple<T>({
  items,
  fields,
  debounceMs = 200,
  minQueryLength = 1,
}: {
  items: T[];
  fields: (keyof T & string)[];
  debounceMs?: number;
  minQueryLength?: number;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, debounceMs);

  const results = useMemo(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < minQueryLength) return items;
    const q = debouncedQuery.toLowerCase();
    return items.filter((item) =>
      fields.some((field) => {
        const value = item[field];
        return typeof value === "string" && value.toLowerCase().includes(q);
      })
    );
  }, [debouncedQuery, items, fields, minQueryLength]);

  const clear = useCallback(() => {
    setQuery("");
  }, []);

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    clear,
    isSearching: query !== debouncedQuery,
  };
}
