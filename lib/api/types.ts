// Shapes returned by the UMS API (assignment 6). Prisma Decimals arrive as strings, dates as ISO strings.

export const ROLES = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export type EnrollmentStatus = "ENROLLED" | "DROPPED" | "COMPLETED";
export type InvoiceStatus = "UNPAID" | "PAID" | "CANCELLED";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

export const GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"] as const;
export type Grade = (typeof GRADES)[number];

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: unknown[];
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentCode: string | null;
  avatarUrl: string | null;
  departmentId: string | null;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string | null;
  credits: number;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDetail extends Course {
  prerequisites: { courseId: string; prerequisiteId: string; prerequisite: Course }[];
}

export interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  enrollmentOpen: boolean;
  tuitionPerCredit: string;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  courseId: string;
  semesterId: string;
  instructorId: string;
  sectionCode: string;
  capacity: number;
  enrolledCount: number;
  createdAt: string;
  updatedAt: string;
}

/** GET /sections and GET /sections/:id */
export interface SectionWithRelations extends Section {
  course: Course;
  semester: Semester;
  instructor: { id: string; name: string };
}

/** GET /sections/my (instructor) */
export interface TeachingSection extends Section {
  course: Course;
  semester: Semester;
}

export interface Enrollment {
  id: string;
  studentId: string;
  sectionId: string;
  status: EnrollmentStatus;
  grade: string | null;
  gradePoint: string | null;
  enrolledAt: string;
  droppedAt: string | null;
  updatedAt: string;
}

/** GET /enrollments/my */
export interface MyEnrollment extends Enrollment {
  section: Section & { course: Course; semester: Semester };
}

/** GET /sections/:id/students */
export interface RosterEntry extends Enrollment {
  student: { id: string; name: string; email: string; studentCode: string | null };
}

export interface TranscriptCourse {
  courseCode: string;
  title: string;
  credits: number;
  grade: string | null;
  enrolledAt: string;
  isCounted: boolean;
}

export interface Transcript {
  gpa: number;
  totalCredits: number;
  courses: TranscriptCourse[];
}

export interface PaymentAttempt {
  id: string;
  status: PaymentStatus;
  amount: string;
  currency: string;
  failureReason: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  semesterId: string;
  totalCredits: number;
  amount: string;
  status: InvoiceStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /invoices/my — `payments` is present once the backend includes attempt history. */
export interface InvoiceWithSemester extends Invoice {
  semester: Semester;
  payments?: PaymentAttempt[];
}

export interface CheckoutSession {
  checkoutUrl: string;
  paymentId: string;
}

/** GET /payments/success and /payments/cancel */
export interface PaymentSummary {
  id: string;
  status: PaymentStatus;
  amount: string;
  currency: string;
  failureReason: string | null;
  invoice: { id: string; status: InvoiceStatus; paidAt: string | null };
}

export interface AdminStats {
  users: Record<Role, number>;
  courses: number;
  sections: number;
  activeEnrollments: number;
  paidInvoices: number;
  unpaidInvoices: number;
  revenue: number;
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata: JsonValue;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
}
