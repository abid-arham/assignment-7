import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { Api, AuditLogParams, CourseListParams, SectionListParams, UserListParams } from "./endpoints";

/**
 * Query definitions shared by the server (prefetch + HydrationBoundary, using serverApi) and the browser
 * (useQuery, using the /api/proxy api). Same factory → same key, so hydrated data is reused as-is.
 */
export const queryKeys = {
  me: ["me"] as const,
  departments: ["departments"] as const,
  semesters: ["semesters"] as const,
  courses: (params: CourseListParams) => ["courses", params] as const,
  course: (id: string) => ["course", id] as const,
  sections: (params: SectionListParams) => ["sections", params] as const,
  myEnrollments: ["enrollments", "me"] as const,
  transcript: ["transcript"] as const,
  myInvoices: ["invoices", "me"] as const,
  teaching: ["teaching"] as const,
  roster: (sectionId: string) => ["roster", sectionId] as const,
  stats: ["admin", "stats"] as const,
  users: (params: UserListParams) => ["admin", "users", params] as const,
  auditLogs: (params: AuditLogParams) => ["admin", "audit-logs", params] as const,
};

export const queries = {
  me: (api: Api) => queryOptions({ queryKey: queryKeys.me, queryFn: api.me }),
  departments: (api: Api) =>
    queryOptions({ queryKey: queryKeys.departments, queryFn: api.departments, staleTime: 5 * 60_000 }),
  semesters: (api: Api) => queryOptions({ queryKey: queryKeys.semesters, queryFn: api.semesters, staleTime: 60_000 }),
  courses: (api: Api, params: CourseListParams) =>
    queryOptions({
      queryKey: queryKeys.courses(params),
      queryFn: () => api.courses(params),
      placeholderData: keepPreviousData,
    }),
  course: (api: Api, id: string) => queryOptions({ queryKey: queryKeys.course(id), queryFn: () => api.course(id) }),
  sections: (api: Api, params: SectionListParams = {}) =>
    queryOptions({
      queryKey: queryKeys.sections(params),
      queryFn: () => api.sections(params),
      placeholderData: keepPreviousData,
    }),
  myEnrollments: (api: Api) => queryOptions({ queryKey: queryKeys.myEnrollments, queryFn: api.myEnrollments }),
  transcript: (api: Api) => queryOptions({ queryKey: queryKeys.transcript, queryFn: api.transcript }),
  myInvoices: (api: Api) => queryOptions({ queryKey: queryKeys.myInvoices, queryFn: api.myInvoices }),
  teaching: (api: Api) => queryOptions({ queryKey: queryKeys.teaching, queryFn: api.mySections }),
  roster: (api: Api, sectionId: string) =>
    queryOptions({ queryKey: queryKeys.roster(sectionId), queryFn: () => api.roster(sectionId) }),
  stats: (api: Api) => queryOptions({ queryKey: queryKeys.stats, queryFn: api.stats }),
  users: (api: Api, params: UserListParams) =>
    queryOptions({
      queryKey: queryKeys.users(params),
      queryFn: () => api.users(params),
      placeholderData: keepPreviousData,
    }),
  auditLogs: (api: Api, params: AuditLogParams) =>
    queryOptions({
      queryKey: queryKeys.auditLogs(params),
      queryFn: () => api.auditLogs(params),
      placeholderData: keepPreviousData,
    }),
};
