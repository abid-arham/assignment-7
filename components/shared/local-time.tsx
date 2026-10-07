"use client";

import { useSyncExternalStore } from "react";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";

const subscribe = () => () => {};

/**
 * Timestamps in the viewer's time zone. The server doesn't know it, so it renders a stable UTC date and
 * the browser swaps in local/relative time right after hydration (no mismatch warning, no wrong zone).
 */
export function LocalTime({ value, mode = "datetime" }: { value: string; mode?: "datetime" | "relative" }) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const text = !isClient ? formatDate(value) : mode === "relative" ? formatRelative(value) : formatDateTime(value);

  return (
    <time dateTime={value} title={isClient ? formatDateTime(value) : undefined} className="whitespace-nowrap">
      {text}
    </time>
  );
}
