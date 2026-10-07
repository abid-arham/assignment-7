export const siteConfig = {
  name: "Quad",
  fullName: "Quad University Management System",
  tagline: "Registration, grading and tuition in one place",
  description:
    "Quad runs a university's academic year end to end: course registration with prerequisite checks, instructor grading, GPA transcripts and online tuition payments.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "registrar@ums.demo",
} as const;
