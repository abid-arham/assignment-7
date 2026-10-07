"use client";

import { useQuery } from "@tanstack/react-query";
import type { Role } from "@/lib/api/types";

export interface PublicSession {
  role: Role;
  exp: number;
}

/**
 * Who's signed in, for public pages. Those pages are statically rendered (no cookies on the server), so the
 * browser asks /api/auth/session — which reads the httpOnly cookie — once and caches the answer.
 */
export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) return null;
      return ((await res.json()) as { session: PublicSession | null }).session;
    },
    staleTime: 60_000,
  });
}
