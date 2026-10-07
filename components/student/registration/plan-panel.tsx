"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircleIcon, ClipboardCheckIcon, ShoppingBasketIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import { explainEnrollError } from "@/hooks/use-student-mutations";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/queries";
import { formatMoney, plural } from "@/lib/format";
import { planTotals, useRegistrationPlan } from "@/stores/registration-plan";
import { cn } from "@/lib/utils";

/**
 * The shortlist of sections and the "Register all" action. Each section is enrolled one by one so a
 * single failure (full section, missing prerequisite) doesn't block the rest; failures stay in the plan
 * with the reason shown under them.
 */
export function PlanPanel({ className, onDone }: { className?: string; onDone?: () => void }) {
  const items = useRegistrationPlan((s) => s.items);
  const remove = useRegistrationPlan((s) => s.remove);
  const clear = useRegistrationPlan((s) => s.clear);
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [failures, setFailures] = useState<Record<string, string>>({});

  const { credits, tuition } = planTotals(items);
  const duplicateCourses = new Set(
    items.map((i) => i.courseId).filter((id, index, all) => all.indexOf(id) !== index),
  );

  const registerAll = async () => {
    setSubmitting(true);
    const nextFailures: Record<string, string> = {};
    const enrolled: string[] = [];
    for (const item of items) {
      try {
        await api.enroll(item.sectionId);
        enrolled.push(item.courseCode);
        remove(item.sectionId);
      } catch (error) {
        nextFailures[item.sectionId] = await explainEnrollError(error);
      }
    }
    setFailures(nextFailures);
    setSubmitting(false);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.myEnrollments }),
      queryClient.invalidateQueries({ queryKey: ["sections"] }),
    ]);

    const failed = Object.keys(nextFailures).length;
    if (enrolled.length) {
      toast.success(`Registered for ${enrolled.join(", ")}`, {
        description: "Generate your tuition invoice from Tuition & payments when you're done.",
      });
    }
    if (failed) toast.error(`${plural(failed, "section")} couldn't be added`, { description: "See the reasons in your plan." });
    if (!failed) onDone?.();
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-sans text-base font-semibold tracking-normal">
          <ShoppingBasketIcon className="size-4 text-primary" /> Registration plan
        </h2>
        {items.length > 0 && (
          <Button variant="ghost" size="xs" onClick={clear} disabled={submitting}>
            Clear
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
          Add sections from the list to build your timetable, then register for all of them at once.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.sectionId} className="rounded-xl border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {item.courseCode} <span className="text-muted-foreground">· Section {item.sectionCode}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.courseTitle} · {plural(item.credits, "credit")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => remove(item.sectionId)}
                  disabled={submitting}
                  aria-label={`Remove ${item.courseCode} from plan`}
                >
                  <Trash2Icon />
                </Button>
              </div>
              {duplicateCourses.has(item.courseId) && (
                <p className="mt-2 text-xs text-warning">Two sections of the same course — keep only one.</p>
              )}
              {failures[item.sectionId] && (
                <p className="mt-2 flex gap-1.5 text-xs text-destructive" role="alert">
                  <AlertCircleIcon className="mt-px size-3.5 shrink-0" /> {failures[item.sectionId]}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <dl className="grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-3 text-sm">
        <dt className="text-muted-foreground">Credits</dt>
        <dd className="text-right font-medium tabular-nums">{credits}</dd>
        <dt className="text-muted-foreground">Estimated tuition</dt>
        <dd className="text-right font-medium tabular-nums">{formatMoney(tuition)}</dd>
      </dl>

      <Button size="lg" onClick={registerAll} disabled={items.length === 0 || submitting || duplicateCourses.size > 0}>
        {submitting ? <Spinner /> : <ClipboardCheckIcon />}
        {submitting ? "Registering…" : `Register for ${plural(items.length, "section")}`}
      </Button>
    </div>
  );
}
