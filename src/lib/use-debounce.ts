"use client";

import { useEffect, useState } from "react";

/** Default delay for search boxes that query the API (keep all callers aligned). */
export const SEARCH_DEBOUNCE_MS = 400;

/**
 * Debounces a value for server-backed search/input (avoids flooding the API).
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
