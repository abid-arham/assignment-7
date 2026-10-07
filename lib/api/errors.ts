/** An error response from the UMS API ({ success: false, message, errors }). */
export class ApiError extends Error {
  readonly status: number;
  readonly issues: unknown[];

  constructor(status: number, message: string, issues: unknown[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "You're going a little fast — please wait a moment and try again.";
    // Validation failures carry field issues; surface the first one when it's more specific than the generic message.
    const first = Object.values(getFieldErrors(error))[0];
    if (error.status === 422 && error.message === "Validation failed" && first) return first;
    return error.message;
  }
  if (error instanceof TypeError) return "Can't reach the server. Check your connection and try again.";
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * Maps the API's Zod issues (path like ["body", "name"]) to { name: message } so forms can show them
 * next to the matching field.
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    if (typeof issue !== "object" || issue === null) continue;
    const { path, message } = issue as { path?: unknown; message?: unknown };
    if (!Array.isArray(path) || typeof message !== "string") continue;
    const field = path.filter((p) => p !== "body" && p !== "query" && p !== "params").join(".");
    if (field && !result[field]) result[field] = message;
  }
  return result;
}
