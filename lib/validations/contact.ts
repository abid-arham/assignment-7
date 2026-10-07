import { z } from "zod";

export const CONTACT_TOPICS = ["Registration", "Grades & transcripts", "Tuition & payments", "Account access", "Something else"] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(100, "Keep it under 100 characters"),
  email: z.email("Enter an email we can reply to").trim(),
  studentId: z
    .string()
    .trim()
    .max(20, "Student IDs are at most 20 characters")
    .regex(/^$|^[A-Za-z0-9-]+$/, "Letters, numbers and dashes only"),
  topic: z.enum(CONTACT_TOPICS, { error: "Choose a topic" }),
  message: z
    .string()
    .trim()
    .min(20, "Add a little more detail (at least 20 characters)")
    .max(2000, "Keep it under 2000 characters"),
});
export type ContactInput = z.input<typeof contactSchema>;
