import { Badge } from "@/components/ui/badge";
import type { EnrollmentStatus, InvoiceStatus, PaymentStatus, Role } from "@/lib/api/types";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

const toneClass: Record<Tone, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-highlight-foreground dark:text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/15 text-info",
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
};

const STATUS: Record<string, { label: string; tone: Tone }> = {
  // enrollments
  ENROLLED: { label: "Enrolled", tone: "info" },
  COMPLETED: { label: "Completed", tone: "success" },
  DROPPED: { label: "Dropped", tone: "neutral" },
  // invoices
  UNPAID: { label: "Unpaid", tone: "warning" },
  PAID: { label: "Paid", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  // payments
  PENDING: { label: "Pending", tone: "warning" },
  SUCCEEDED: { label: "Succeeded", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
  // semesters / users
  OPEN: { label: "Enrollment open", tone: "success" },
  CLOSED: { label: "Enrollment closed", tone: "neutral" },
  ACTIVE: { label: "Active", tone: "success" },
  INACTIVE: { label: "Deactivated", tone: "danger" },
};

export type StatusValue = EnrollmentStatus | InvoiceStatus | PaymentStatus | "OPEN" | "CLOSED" | "ACTIVE" | "INACTIVE";

export function StatusBadge({ status, className }: { status: StatusValue; className?: string }) {
  const { label, tone } = STATUS[status] ?? { label: status, tone: "neutral" as const };
  return (
    <Badge variant="secondary" className={cn(toneClass[tone], className)}>
      {label}
    </Badge>
  );
}

const roleTone: Record<Role, Tone> = { ADMIN: "primary", INSTRUCTOR: "success", STUDENT: "warning" };

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <Badge variant="secondary" className={cn(toneClass[roleTone[role]], className)}>
      {ROLE_LABEL[role]}
    </Badge>
  );
}

/** Letter grades coloured by band: A green, B blue, C amber, D/F red. */
export function GradeBadge({ grade, className }: { grade: string | null; className?: string }) {
  if (!grade) return <span className="text-muted-foreground">—</span>;
  const tone: Tone = grade.startsWith("A")
    ? "success"
    : grade.startsWith("B")
      ? "info"
      : grade.startsWith("C")
        ? "warning"
        : "danger";
  return (
    <Badge variant="secondary" className={cn("min-w-9 font-semibold tabular-nums", toneClass[tone], className)}>
      {grade}
    </Badge>
  );
}
