import { QueryClient, isServer } from "@tanstack/react-query";
import { isApiError } from "@/lib/api/errors";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Server-prefetched data stays fresh briefly so hydration doesn't trigger an immediate refetch.
        staleTime: 30_000,
        // 4xx responses won't change on retry; only retry network/5xx failures, once.
        retry: (failureCount, error) => failureCount < 1 && !(isApiError(error) && error.status < 500),
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** A fresh client per server request; one shared client in the browser. */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
