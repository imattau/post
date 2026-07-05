import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { SearchResult } from "minisearch";

export function useSearch<T>({
  items,
  searchFn,
  debounceMs = 200,
  minQueryLength = 1,
  extractFields,
}: {
  items: T[];
  searchFn: (query: string, items: T[]) => SearchResult[];
  debounceMs?: number;
  minQueryLength?: number;
  extractFields?: (item: T) => Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, debounceMs]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < minQueryLength) return items;
    const searchResults = searchFn(debouncedQuery, items);
    const resultMap = new Map(searchResults.map((r, i) => [r.id, i]));
    return items
      .filter((item) => resultMap.has((item as any).id))
      .sort((a, b) => {
        const ia = resultMap.get((a as any).id) ?? Infinity;
        const ib = resultMap.get((b as any).id) ?? Infinity;
        return ia - ib;
      });
  }, [debouncedQuery, items, searchFn, minQueryLength]);

  const clear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
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
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, debounceMs]);

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
    setDebouncedQuery("");
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
