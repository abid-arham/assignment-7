"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, RotateCcwIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ALL_COURSES, PrerequisitePicker } from "@/components/admin/course-wizard/prerequisite-picker";
import { Spinner } from "@/components/shared/spinner";
import { api } from "@/lib/api/client";
import { getErrorMessage, isApiError } from "@/lib/api/errors";
import { queries } from "@/lib/api/queries";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { courseWizardSchema, type CourseWizardInput, type CourseWizardOutput } from "@/lib/validations/admin";
import { EMPTY_COURSE_DRAFT, useCourseWizard } from "@/stores/course-wizard";

const STEPS: { title: string; description: string; fields: FieldPath<CourseWizardInput>[] }[] = [
  { title: "Basics", description: "Code, title and what the course covers.", fields: ["code", "title", "description"] },
  { title: "Placement", description: "Owning department and credit value.", fields: ["departmentId", "credits"] },
  { title: "Prerequisites", description: "Courses a student must pass first.", fields: ["prerequisiteIds"] },
  { title: "Review", description: "Check everything, then publish.", fields: [] },
];

export function CourseWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { step, setStep, saveDraft, reset } = useCourseWizard();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { data: departments } = useQuery(queries.departments(api));
  const { data: allCourses } = useQuery(queries.courses(api, ALL_COURSES));

  const form = useForm<CourseWizardInput, unknown, CourseWizardOutput>({
    resolver: zodResolver(courseWizardSchema),
    mode: "onTouched",
    defaultValues: EMPTY_COURSE_DRAFT,
  });
  const { errors } = form.formState;
  const values = useWatch({ control: form.control });

  // Restore a draft saved earlier in this tab, then keep saving as the admin types.
  useEffect(() => {
    void Promise.resolve(useCourseWizard.persist.rehydrate()).then(() => {
      form.reset(useCourseWizard.getState().draft);
      setReady(true);
    });
  }, [form]);
  useEffect(() => {
    if (ready) saveDraft({ ...EMPTY_COURSE_DRAFT, ...values } as CourseWizardInput);
  }, [ready, values, saveDraft]);

  const next = async () => {
    if (await form.trigger(STEPS[step]!.fields, { shouldFocus: true })) setStep(step + 1);
  };

  const startOver = () => {
    reset();
    form.reset(EMPTY_COURSE_DRAFT);
  };

  const publish = form.handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const course = await api.createCourse({
        code: data.code,
        title: data.title,
        description: data.description || undefined,
        credits: data.credits,
        departmentId: data.departmentId,
      });
      const failed: string[] = [];
      for (const prereqId of data.prerequisiteIds) {
        await api.addPrerequisite(course.id, prereqId).catch(() => {
          failed.push(allCourses?.items.find((c) => c.id === prereqId)?.code ?? prereqId);
        });
      }
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      if (failed.length) toast.warning(`${course.code} created, but ${failed.join(", ")} couldn't be linked as prerequisites.`);
      else toast.success(`${course.code} is now in the catalogue`);
      reset();
      router.push(`/admin/courses/${course.id}`);
    } catch (error) {
      if (isApiError(error) && error.status === 409) {
        setStep(0);
        form.setError("code", { type: "server", message: "A course with this code already exists" });
      }
      toast.error("Couldn't create the course", { description: getErrorMessage(error) });
      setSubmitting(false);
    }
  });

  // Enter / "Continue" validates the current step; only the last step publishes.
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (step === STEPS.length - 1) return void publish(event);
    event.preventDefault();
    void next();
  };

  const department = departments?.find((d) => d.id === values.departmentId);
  const prereqs = allCourses?.items.filter((c) => values.prerequisiteIds?.includes(c.id)) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      {/* Stepper: completed steps can be revisited, future ones only via "Continue" (which validates). */}
      <ol className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s.title} className="shrink-0">
            <button
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors disabled:cursor-default",
                i === step ? "bg-primary/10 text-primary" : "hover:bg-muted disabled:hover:bg-transparent",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  i < step && "border-primary bg-primary text-primary-foreground",
                  i === step && "border-primary",
                )}
              >
                {i < step ? <CheckIcon className="size-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:block">
                <span className="block font-medium">{s.title}</span>
                <span className="hidden text-xs text-muted-foreground lg:block">{s.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <Card>
        <form onSubmit={onSubmit} noValidate>
          <CardHeader>
            <CardTitle className="text-lg">
              Step {step + 1} of {STEPS.length}: {STEPS[step]!.title}
            </CardTitle>
            <CardDescription>{STEPS[step]!.description}</CardDescription>
          </CardHeader>

          <CardContent className="py-6">
            {!ready ? (
              <Spinner className="mx-auto" />
            ) : step === 0 ? (
              <FieldGroup>
                <Field data-invalid={!!errors.code}>
                  <FieldLabel htmlFor="code">Course code</FieldLabel>
                  <Input id="code" placeholder="CSE330" className="uppercase" aria-invalid={!!errors.code} {...form.register("code")} />
                  <FieldDescription>Unique and permanent, e.g. department code + number.</FieldDescription>
                  <FieldError errors={[errors.code]} />
                </Field>
                <Field data-invalid={!!errors.title}>
                  <FieldLabel htmlFor="title">Title</FieldLabel>
                  <Input id="title" placeholder="Computer Networks" aria-invalid={!!errors.title} {...form.register("title")} />
                  <FieldError errors={[errors.title]} />
                </Field>
                <Field data-invalid={!!errors.description}>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    id="description"
                    rows={5}
                    placeholder="Topics, assessments and what students will be able to do afterwards."
                    aria-invalid={!!errors.description}
                    {...form.register("description")}
                  />
                  <FieldDescription>{(values.description ?? "").length}/2000 · shown in the public catalogue.</FieldDescription>
                  <FieldError errors={[errors.description]} />
                </Field>
              </FieldGroup>
            ) : step === 1 ? (
              <FieldGroup>
                <Field data-invalid={!!errors.departmentId}>
                  <FieldLabel htmlFor="departmentId">Department</FieldLabel>
                  <Controller
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="departmentId" className="w-full" aria-invalid={!!errors.departmentId}>
                          <SelectValue placeholder="Choose a department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments?.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name} ({d.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[errors.departmentId]} />
                </Field>
                <Field data-invalid={!!errors.credits}>
                  <FieldLabel htmlFor="credits">Credits</FieldLabel>
                  <Input
                    id="credits"
                    type="number"
                    min={1}
                    max={6}
                    className="w-28"
                    aria-invalid={!!errors.credits}
                    {...form.register("credits", { valueAsNumber: true })}
                  />
                  <FieldDescription>1–6. Tuition is billed per credit.</FieldDescription>
                  <FieldError errors={[errors.credits]} />
                </Field>
              </FieldGroup>
            ) : step === 2 ? (
              <Field data-invalid={!!errors.prerequisiteIds}>
                <Controller
                  control={form.control}
                  name="prerequisiteIds"
                  render={({ field }) => <PrerequisitePicker value={field.value} onChange={field.onChange} />}
                />
                <FieldError errors={[errors.prerequisiteIds]} />
              </Field>
            ) : (
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Code</dt>
                  <dd className="font-medium uppercase">{values.code}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Title</dt>
                  <dd className="font-medium">{values.title}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Department</dt>
                  <dd className="font-medium">{department ? `${department.name} (${department.code})` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Credits</dt>
                  <dd className="font-medium">{plural(Number(values.credits ?? 0), "credit")}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Prerequisites</dt>
                  <dd className="font-medium">{prereqs.length ? prereqs.map((c) => c.code).join(", ") : "None"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="whitespace-pre-line">{values.description || "—"}</dd>
                </div>
              </dl>
            )}
          </CardContent>

          <CardFooter className="flex-wrap justify-between gap-2">
            <Button type="button" variant="ghost" onClick={startOver} disabled={submitting}>
              <RotateCcwIcon /> Start over
            </Button>
            <div className="flex gap-2">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={submitting}>
                  <ArrowLeftIcon /> Back
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button type="submit" disabled={!ready}>
                  Continue <ArrowRightIcon />
                </Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Spinner /> : <SparklesIcon />} Create course
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
