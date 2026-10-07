import { ApiError } from "./errors";
import type { ApiFailure, ApiSuccess } from "./types";

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** JSON-serialised unless it is FormData. */
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
}

/** Calls an API path and resolves to the envelope's `data`; rejects with ApiError on failure. */
export type Fetcher = <T>(path: string, options?: RequestOptions) => Promise<T>;

export function buildQuery(query?: Record<string, QueryValue>): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function buildInit(options: RequestOptions, headers: Record<string, string> = {}): RequestInit {
  const { method = "GET", body, signal, cache, next } = options;
  const init: RequestInit & { next?: RequestOptions["next"] } = {
    method,
    signal,
    headers: { accept: "application/json", ...headers },
  };
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    (init.headers as Record<string, string>)["content-type"] = "application/json";
  }
  if (cache) init.cache = cache;
  if (next) init.next = next;
  return init;
}

export async function parseResponse<T>(res: Response): Promise<T> {
  let payload: ApiSuccess<T> | ApiFailure | undefined;
  try {
    payload = (await res.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    payload = undefined;
  }

  if (!res.ok || !payload || payload.success !== true) {
    const message =
      payload && "message" in payload && payload.message
        ? payload.message
        : `Request failed (${res.status} ${res.statusText || "error"})`;
    const issues = payload && payload.success === false ? (payload.errors ?? []) : [];
    throw new ApiError(res.ok ? 500 : res.status, message, issues);
  }

  return payload.data;
}
