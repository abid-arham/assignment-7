"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queries } from "@/lib/api/queries";
import type { User } from "@/lib/api/types";

const AuthContext = createContext<User | null>(null);

/**
 * The signed-in user, loaded once by the dashboard layout on the server and kept in the TanStack cache
 * under ["me"], so a profile update (setQueryData) refreshes the sidebar and header instantly.
 */
export function AuthProvider({ initialUser, children }: { initialUser: User; children: React.ReactNode }) {
  const { data } = useQuery({ ...queries.me(api), initialData: initialUser, staleTime: 5 * 60_000 });
  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const user = useContext(AuthContext);
  if (!user) throw new Error("useAuth must be used inside the dashboard (AuthProvider).");
  return { user, role: user.role };
}
