"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { refreshSession } from "@/lib/api/client";

/** Renew this long before the 15-minute access token runs out. */
const LEAD_SECONDS = 90;

/**
 * Keeps an open dashboard signed in: renews the token pair shortly before the access token expires,
 * and immediately when the tab becomes visible again after sleeping past that point.
 */
export function SessionKeeper({ exp }: { exp: number }) {
  const expRef = useRef(exp);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const renew = async () => {
      const next = await refreshSession();
      if (cancelled) return;
      if (next) {
        expRef.current = next;
        schedule();
      } else {
        toast.error("Your session has ended", { description: "Please log in again to continue." });
      }
    };

    const schedule = () => {
      clearTimeout(timer);
      const ms = (expRef.current - LEAD_SECONDS) * 1000 - Date.now();
      timer = setTimeout(renew, Math.max(ms, 0));
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() / 1000 > expRef.current - LEAD_SECONDS) void renew();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
