import { z } from "zod";
import { ROLES } from "@/lib/api/types";

/**
 * URL search-param schemas shared by Server Components (prefetch) and Client Components (useQuery), so
 * both build the same params object — and therefore the same TanStack Query key. `.catch()` turns a
 * hand-edited bad value into the default instead of an error.
 */

type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

function toRecord(raw: RawParams): Record<string, string | undefined> {
  if (raw instanceof URLSearchParams) return Object.fromEntries(raw.entries());
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) out[key] = Array.isArray(value) ? value[0] : value;
  return out;
}

export function parseSearch<S extends z.ZodType>(schema: S, raw: RawParams): z.infer<S> {
  return schema.parse(toRecord(raw));
}

const page = z.coerce.number().int().min(1).catch(1);
const text = z.string().trim().max(100).optional().catch(undefined).transform((v) => v || undefined);
const id = z.string().trim().max(40).optional().catch(undefined).transform((v) => v || undefined);

export const courseCatalogSearch = z.object({
  page,
  q: text,
  departmentId: id,
  sortBy: z.enum(["title", "code", "createdAt"]).catch("title"),
});

export const adminUsersSearch = z.object({
  page,
  q: text,
  role: z.enum(ROLES).optional().catch(undefined),
});

export const auditLogSearch = z.object({
  page,
  entity: text,
  action: text,
});

export const sectionsSearch = z.object({
  page,
  semesterId: id,
  courseId: id,
  instructorId: id,
});

export const registrationSearch = z.object({
  semesterId: id,
  departmentId: id,
  q: text,
  seats: z.enum(["all", "open"]).catch("all"),
});

export const enrollmentsSearch = z.object({
  status: z.enum(["all", "ENROLLED", "COMPLETED", "DROPPED"]).catch("all"),
});

export const rosterSearch = z.object({
  q: text,
  status: z.enum(["all", "ungraded", "graded"]).catch("all"),
});
