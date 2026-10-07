import { buildInit, buildQuery, parseResponse, type Fetcher, type RequestOptions } from "./core";
import { createApi } from "./endpoints";

let refreshing: Promise<number | null> | null = null;

/**
 * Rotates the session through /api/auth/refresh. Concurrent callers share one request: the API revokes a
 * refresh token once it's used, so two parallel refreshes would log the user out.
 * Resolves to the new access-token expiry (epoch seconds), or null if the session is over.
 */
export function refreshSession(): Promise<number | null> {
  refreshing ??= fetch("/api/auth/refresh", { method: "POST", cache: "no-store" })
    .then(async (res) => (res.ok ? ((await res.json()) as { exp: number }).exp : null))
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

function sendToLogin() {
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

/** Browser calls go through the same-origin BFF route, which attaches the httpOnly token. */
export const clientFetch: Fetcher = async <T>(path: string, options: RequestOptions = {}) => {
  const send = () => fetch(`/api/proxy${path}${buildQuery(options.query)}`, buildInit(options));

  let res = await send();
  if (res.status === 401) {
    if (await refreshSession()) res = await send();
    if (res.status === 401) {
      sendToLogin();
    }
  }
  return parseResponse<T>(res);
};

export const api = createApi(clientFetch);
