"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { QueryValue } from "@/lib/api/core";

interface Options {
  /**
   * "shallow" (default) updates the URL with history.pushState: no server round-trip, the client
   * component's TanStack Query picks up the new params. "server" uses router.replace so a Server
   * Component page re-renders with the new searchParams.
   */
  mode?: "shallow" | "server";
}

interface SetOptions {
  /** Replace the history entry instead of pushing (use for keystrokes in a search box). */
  replace?: boolean;
  /** Filters change the result set, so they go back to page 1 unless `page` is part of the update. */
  resetPage?: boolean;
}

/** Filters, sorting, search and pagination live in the URL so every view can be bookmarked and shared. */
export function useQueryParams({ mode = "shallow" }: Options = {}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setParams = useCallback(
    (updates: Record<string, QueryValue>, { replace = false, resetPage = true }: SetOptions = {}) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === "" || value === false) next.delete(key);
        else next.set(key, String(value));
      }
      if (resetPage && !("page" in updates)) next.delete("page");
      if (next.get("page") === "1") next.delete("page");

      const qs = next.toString();
      if (qs === searchParams.toString()) return;
      const url = qs ? `${pathname}?${qs}` : pathname;

      if (mode === "server") {
        startTransition(() => router.replace(url, { scroll: false }));
      } else if (replace) {
        window.history.replaceState(null, "", url);
      } else {
        window.history.pushState(null, "", url);
      }
    },
    [mode, pathname, router, searchParams],
  );

  return { searchParams, setParams, isPending };
}
