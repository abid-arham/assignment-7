"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarXIcon, SearchXIcon, ShoppingBasketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/dashboard/auth-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { PlanPanel } from "@/components/student/registration/plan-panel";
import { SectionCard, type SectionStanding } from "@/components/student/registration/section-card";
import { useQueryParams } from "@/hooks/use-query-params";
import { api } from "@/lib/api/client";
import { queries } from "@/lib/api/queries";
import type { MyEnrollment, SectionWithRelations } from "@/lib/api/types";
import { formatDateRange, formatMoney, plural } from "@/lib/format";
import { parseSearch, registrationSearch } from "@/lib/search-params";
import { openSemesters, pickRegistrationSemester } from "@/lib/semesters";
import { planTotals, useRegistrationPlan, type PlanItem } from "@/stores/registration-plan";

function standingFor(section: SectionWithRelations, mine: MyEnrollment[], planned: Set<string>): SectionStanding {
  const sameCourse = mine.filter((e) => e.section.courseId === section.courseId);
  const active = sameCourse.find((e) => e.status === "ENROLLED");
  if (active) return { kind: "enrolled", sectionCode: active.section.sectionCode };
  const passed = sameCourse.find((e) => e.status === "COMPLETED" && Number(e.gradePoint ?? 0) > 0);
  if (passed) return { kind: "completed", grade: passed.grade };
  if (planned.has(section.id)) return { kind: "planned" };
  if (section.enrolledCount >= section.capacity) return { kind: "full" };
  return { kind: "available" };
}

export function RegistrationView() {
  const { user } = useAuth();
  const { searchParams, setParams } = useQueryParams();
  const filters = parseSearch(registrationSearch, searchParams);

  const semestersQuery = useQuery(queries.semesters(api));
  const departmentsQuery = useQuery(queries.departments(api));
  const enrollmentsQuery = useQuery(queries.myEnrollments(api));
  const semester = semestersQuery.data ? pickRegistrationSemester(semestersQuery.data, filters.semesterId) : undefined;
  const sectionsQuery = useQuery({
    ...queries.sections(api, { semesterId: semester?.id }),
    enabled: Boolean(semester),
  });

  // Plan store: rehydrate from localStorage after mount and reset it if another student used this browser.
  const items = useRegistrationPlan((s) => s.items);
  const add = useRegistrationPlan((s) => s.add);
  const [planOpen, setPlanOpen] = useState(false);
  useEffect(() => {
    void Promise.resolve(useRegistrationPlan.persist.rehydrate()).then(() =>
      useRegistrationPlan.getState().claim(user.id),
    );
  }, [user.id]);

  const planned = new Set(items.map((i) => i.sectionId));
  const q = filters.q?.toLowerCase();
  const visible = (sectionsQuery.data ?? [])
    .filter((s) => !filters.departmentId || s.course.departmentId === filters.departmentId)
    .filter((s) => !q || s.course.code.toLowerCase().includes(q) || s.course.title.toLowerCase().includes(q))
    .filter((s) => filters.seats === "all" || s.enrolledCount < s.capacity)
    .sort((a, b) => a.course.code.localeCompare(b.course.code) || a.sectionCode.localeCompare(b.sectionCode));

  if (semestersQuery.data && !semester) {
    return (
      <EmptyState
        icon={CalendarXIcon}
        title="Registration is closed"
        description="No semester is open for enrollment right now. The registrar will open the next term soon."
      />
    );
  }

  const addToPlan = (section: SectionWithRelations) => {
    if (!semester) return;
    const item: PlanItem = {
      sectionId: section.id,
      courseId: section.courseId,
      courseCode: section.course.code,
      courseTitle: section.course.title,
      credits: section.course.credits,
      sectionCode: section.sectionCode,
      instructorName: section.instructor.name,
      semesterId: semester.id,
      semesterName: semester.name,
      tuitionPerCredit: Number(semester.tuitionPerCredit),
    };
    add(item);
  };

  const { credits, tuition } = planTotals(items);
  const isLoading = semestersQuery.isPending || sectionsQuery.isPending || enrollmentsQuery.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-4">
        {semester && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{semester.name}</span> ·{" "}
            {formatDateRange(semester.startDate, semester.endDate)} · {formatMoney(semester.tuitionPerCredit)} per credit
          </p>
        )}

        <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput
            value={filters.q ?? ""}
            onSearch={(q) => setParams({ q }, { replace: true })}
            placeholder="Search code or title"
            label="Search sections"
          />
          {semestersQuery.data && openSemesters(semestersQuery.data).length > 1 && (
            <Select value={semester?.id} onValueChange={(semesterId) => setParams({ semesterId })}>
              <SelectTrigger className="w-full sm:w-40" aria-label="Semester">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                {openSemesters(semestersQuery.data).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={filters.departmentId ?? "all"}
            onValueChange={(v) => setParams({ departmentId: v === "all" ? null : v })}
          >
            <SelectTrigger className="w-full sm:w-56" aria-label="Department">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departmentsQuery.data?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Switch
              id="open-seats"
              checked={filters.seats === "open"}
              onCheckedChange={(on) => setParams({ seats: on ? "open" : null })}
            />
            <Label htmlFor="open-seats" className="text-sm font-normal">
              Open seats only
            </Label>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={SearchXIcon}
            title="No sections match these filters"
            description="Try a different department or search term, or include full sections."
            action={
              <Button variant="outline" size="sm" onClick={() => setParams({ q: null, departmentId: null, seats: null })}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {plural(visible.length, "section")} available to browse
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  standing={standingFor(section, enrollmentsQuery.data ?? [], planned)}
                  onAdd={() => addToPlan(section)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Desktop: sticky panel. Mobile: summary bar that opens the same panel in a sheet. */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-2xl border bg-card p-4 shadow-sm">
          <PlanPanel />
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
        <Button className="w-full" size="lg" onClick={() => setPlanOpen(true)}>
          <ShoppingBasketIcon />
          Plan: {plural(items.length, "section")} · {credits} cr · {formatMoney(tuition)}
        </Button>
      </div>
      <div className="h-16 lg:hidden" aria-hidden />
      <Sheet open={planOpen} onOpenChange={setPlanOpen}>
        <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Registration plan</SheetTitle>
            <SheetDescription>Sections you&apos;ve shortlisted for registration.</SheetDescription>
          </SheetHeader>
          <PlanPanel className="p-4" onDone={() => setPlanOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
