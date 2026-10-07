import "server-only";

import { dehydrate, type QueryClient } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query-client";

/**
 * Runs queries on the server and returns the dehydrated cache for <HydrationBoundary>:
 *
 *   const state = await prefetch((qc) => Promise.all([qc.prefetchQuery(queries.stats(serverApi))]));
 *
 * prefetchQuery never throws — a failed query is left out and the client component fetches it itself,
 * showing its own error state.
 */
export async function prefetch(load: (queryClient: QueryClient) => Promise<unknown>) {
  const queryClient = makeQueryClient();
  await load(queryClient);
  return dehydrate(queryClient);
}
