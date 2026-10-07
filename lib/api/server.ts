import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { ACCESS_COOKIE, verifyAccessToken } from "@/lib/auth/session";
import type { Role } from "./types";
import { buildInit, buildQuery, parseResponse, type Fetcher, type RequestOptions } from "./core";
import { ApiError } from "./errors";
import { createApi } from "./endpoints";

/** GETs are idempotent, so a dropped connection (cold start, flaky network) gets one more try. */
async function fetchWithRetry(url: string, init: RequestInit) {
  try {
    return await fetch(url, init);
  } catch (error) {
    if ((init.method ?? "GET") !== "GET" || !(error instanceof TypeError)) throw error;
    return fetch(url, init);
  }
}

/**
 * Authenticated calls from Server Components / Server Actions: the access token is read from the
 * httpOnly cookie and sent straight to the API. Never cached — the data is per user.
 */
export const serverFetch: Fetcher = async <T>(path: string, options: RequestOptions = {}) => {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const headers: Record<string, string> = token ? { authorization: `Bearer ${token}` } : {};
  const url = `${env.apiBaseUrl}${path}${buildQuery(options.query)}`;
  const init = buildInit({ cache: "no-store", ...options }, headers);
  const res = await fetchWithRetry(url, init);
  try {
    return await parseResponse<T>(res);
  } catch (error) {
    // proxy.ts refreshes tokens before rendering, so a 401 here means the session is really gone.
    if (error instanceof ApiError && error.status === 401) redirect("/login");
    throw error;
  }
};

/**
 * Anonymous calls for public pages, cached in Next's data cache so catalogue pages don't hit the API
 * on every visit.
 */
export const publicFetch: Fetcher = async <T>(path: string, options: RequestOptions = {}) => {
  const res = await fetchWithRetry(
    `${env.apiBaseUrl}${path}${buildQuery(options.query)}`,
    buildInit({ next: { revalidate: 60, tags: ["catalog"] }, ...options }),
  );
  return parseResponse<T>(res);
};

export const serverApi = createApi(serverFetch);
export const publicApi = createApi(publicFetch);

/** Verified claims from the access-token cookie (deduplicated per request). */
export const getSession = cache(async () => verifyAccessToken((await cookies()).get(ACCESS_COOKIE)?.value));

/** Defence in depth behind proxy.ts: role layouts re-check the role before rendering anything. */
export async function requireRole(role: Role) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== role) redirect("/");
  return session;
}
