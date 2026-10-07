import type { Fetcher } from "./core";
import type {
  AdminStats,
  AuditLog,
  CheckoutSession,
  Course,
  CourseDetail,
  Department,
  Enrollment,
  Grade,
  InvoiceWithSemester,
  Invoice,
  MyEnrollment,
  Paginated,
  PaymentSummary,
  Role,
  RosterEntry,
  Section,
  SectionWithRelations,
  Semester,
  TeachingSection,
  Transcript,
  User,
} from "./types";

export interface CourseListParams {
  page?: number;
  limit?: number;
  q?: string;
  departmentId?: string;
  sortBy?: "title" | "code" | "createdAt";
}

export interface SectionListParams {
  semesterId?: string;
  courseId?: string;
  instructorId?: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  q?: string;
  role?: Role;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  entity?: string;
  action?: string;
}

export interface CourseInput {
  code: string;
  title: string;
  description?: string;
  credits: number;
  departmentId: string;
}

export interface SemesterInput {
  name: string;
  startDate: string;
  endDate: string;
  tuitionPerCredit: number;
  enrollmentOpen?: boolean;
}

export interface SectionInput {
  courseId: string;
  semesterId: string;
  instructorId: string;
  sectionCode: string;
  capacity: number;
}

/** Every API call the app makes, bound to a transport (server: direct with cookie token; browser: /api/proxy). */
export function createApi(f: Fetcher) {
  return {
    // Users
    me: () => f<User>("/users/me"),
    updateMe: (body: { name: string }) => f<User>("/users/me", { method: "PATCH", body }),

    // Catalogue
    departments: () => f<Department[]>("/departments"),
    createDepartment: (body: { name: string; code: string }) =>
      f<Department>("/departments", { method: "POST", body }),
    updateDepartment: (id: string, body: { name?: string; code?: string }) =>
      f<Department>(`/departments/${id}`, { method: "PATCH", body }),
    deleteDepartment: (id: string) => f<null>(`/departments/${id}`, { method: "DELETE" }),

    courses: (query: CourseListParams = {}) => f<Paginated<Course>>("/courses", { query: { ...query } }),
    course: (id: string) => f<CourseDetail>(`/courses/${id}`),
    createCourse: (body: CourseInput) => f<Course>("/courses", { method: "POST", body }),
    updateCourse: (id: string, body: Partial<Omit<CourseInput, "code">>) =>
      f<Course>(`/courses/${id}`, { method: "PATCH", body }),
    deleteCourse: (id: string) => f<null>(`/courses/${id}`, { method: "DELETE" }),
    addPrerequisite: (id: string, prerequisiteId: string) =>
      f<unknown>(`/courses/${id}/prerequisites`, { method: "POST", body: { prerequisiteId } }),
    removePrerequisite: (id: string, prerequisiteId: string) =>
      f<null>(`/courses/${id}/prerequisites/${prerequisiteId}`, { method: "DELETE" }),

    semesters: () => f<Semester[]>("/semesters"),
    createSemester: (body: SemesterInput) => f<Semester>("/semesters", { method: "POST", body }),
    updateSemester: (id: string, body: Partial<SemesterInput>) =>
      f<Semester>(`/semesters/${id}`, { method: "PATCH", body }),

    sections: (query: SectionListParams = {}) => f<SectionWithRelations[]>("/sections", { query: { ...query } }),
    section: (id: string) => f<SectionWithRelations>(`/sections/${id}`),
    createSection: (body: SectionInput) => f<Section>("/sections", { method: "POST", body }),
    updateSection: (id: string, body: { instructorId?: string; capacity?: number }) =>
      f<Section>(`/sections/${id}`, { method: "PATCH", body }),

    // Student
    myEnrollments: () => f<MyEnrollment[]>("/enrollments/my"),
    enroll: (sectionId: string) => f<Enrollment>("/enrollments", { method: "POST", body: { sectionId } }),
    drop: (enrollmentId: string) => f<Enrollment>(`/enrollments/${enrollmentId}/drop`, { method: "POST" }),
    transcript: () => f<Transcript>("/students/me/transcript"),
    myInvoices: () => f<InvoiceWithSemester[]>("/invoices/my"),
    generateInvoice: (semesterId: string) =>
      f<Invoice>("/invoices/generate", { method: "POST", body: { semesterId } }),
    initiatePayment: (invoiceId: string) =>
      f<CheckoutSession>("/payments/initiate", { method: "POST", body: { invoiceId } }),
    confirmPayment: (sessionId: string) =>
      f<PaymentSummary>("/payments/success", { query: { session_id: sessionId } }),
    cancelPayment: (paymentId: string) =>
      f<PaymentSummary>("/payments/cancel", { query: { payment_id: paymentId } }),

    // Instructor
    mySections: () => f<TeachingSection[]>("/sections/my"),
    roster: (sectionId: string) => f<RosterEntry[]>(`/sections/${sectionId}/students`),
    submitGrade: (enrollmentId: string, grade: Grade) =>
      f<Enrollment>(`/enrollments/${enrollmentId}/grade`, { method: "PATCH", body: { grade } }),

    // Admin
    stats: () => f<AdminStats>("/admin/stats"),
    users: (query: UserListParams = {}) => f<Paginated<User>>("/admin/users", { query: { ...query } }),
    changeRole: (id: string, role: Role) => f<User>(`/admin/users/${id}/role`, { method: "PATCH", body: { role } }),
    changeStatus: (id: string, isActive: boolean) =>
      f<User>(`/admin/users/${id}/status`, { method: "PATCH", body: { isActive } }),
    auditLogs: (query: AuditLogParams = {}) =>
      f<Paginated<AuditLog>>("/admin/audit-logs", { query: { ...query } }),
  };
}

export type Api = ReturnType<typeof createApi>;
