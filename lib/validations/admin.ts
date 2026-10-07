import { z } from "zod";

// Each schema mirrors the matching *.validation.ts in the API so the form rejects exactly what the API would.

const requiredId = (label: string) => z.string().min(1, `Choose a ${label}`);
const intField = (label: string) => z.number({ error: `Enter the ${label}` }).int(`${label} must be a whole number`);

export const departmentSchema = z.object({
  name: z.string().trim().min(1, "Enter the department name").max(100, "Keep it under 100 characters"),
  code: z
    .string()
    .trim()
    .min(1, "Enter a short code")
    .max(10, "Codes are at most 10 characters")
    .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only")
    .transform((v) => v.toUpperCase()),
});
export type DepartmentInput = z.input<typeof departmentSchema>;

export const courseBasicsSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Enter a course code")
    .max(20, "Codes are at most 20 characters")
    .regex(/^[A-Za-z0-9-]+$/, "Letters, numbers and dashes only")
    .transform((v) => v.toUpperCase()),
  title: z.string().trim().min(1, "Enter a title").max(150, "Keep the title under 150 characters"),
  description: z.string().trim().max(2000, "Keep the description under 2000 characters"),
});

export const coursePlacementSchema = z.object({
  departmentId: requiredId("department"),
  credits: intField("credits").min(1, "At least 1 credit").max(6, "At most 6 credits"),
});

export const coursePrereqSchema = z.object({
  prerequisiteIds: z.array(z.string()).max(5, "Pick at most 5 prerequisites"),
});

export const courseWizardSchema = courseBasicsSchema.and(coursePlacementSchema).and(coursePrereqSchema);
export type CourseWizardInput = z.input<typeof courseWizardSchema>;
export type CourseWizardOutput = z.output<typeof courseWizardSchema>;

/** Editing never changes the code (the API doesn't allow it). */
export const courseEditSchema = courseBasicsSchema.omit({ code: true }).and(coursePlacementSchema);
export type CourseEditInput = z.input<typeof courseEditSchema>;

export const semesterSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a name, e.g. Fall 2027").max(50, "Keep it under 50 characters"),
    startDate: z.iso.date("Pick a start date"),
    endDate: z.iso.date("Pick an end date"),
    tuitionPerCredit: z.number({ error: "Enter the tuition per credit" }).positive("Tuition must be more than 0"),
    enrollmentOpen: z.boolean(),
  })
  .refine((v) => v.endDate > v.startDate, { path: ["endDate"], message: "End date must be after the start date" });
export type SemesterFormInput = z.input<typeof semesterSchema>;

export const sectionSchema = z.object({
  courseId: requiredId("course"),
  semesterId: requiredId("semester"),
  instructorId: requiredId("instructor"),
  sectionCode: z
    .string()
    .trim()
    .min(1, "Enter a section code")
    .max(5, "At most 5 characters")
    .transform((v) => v.toUpperCase()),
  capacity: intField("capacity").min(1, "Capacity must be at least 1").max(500, "Capacity is at most 500"),
});
export type SectionFormInput = z.input<typeof sectionSchema>;

/** Capacity may not drop below the seats already taken (the API enforces the same rule). */
export const sectionEditSchema = (enrolled: number) =>
  z.object({
    instructorId: requiredId("instructor"),
    capacity: intField("capacity")
      .min(Math.max(1, enrolled), enrolled > 0 ? `${enrolled} students are enrolled — capacity can't go lower` : "Capacity must be at least 1")
      .max(500, "Capacity is at most 500"),
  });
export type SectionEditInput = z.input<ReturnType<typeof sectionEditSchema>>;
