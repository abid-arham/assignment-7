import type { RosterEntry, TeachingSection } from "@/lib/api/types";

export interface SectionSummary {
  section: TeachingSection;
  roster: RosterEntry[];
  graded: number;
  ungraded: number;
  averageGradePoint: number | null;
}

export function summarizeSection(section: TeachingSection, roster: RosterEntry[]): SectionSummary {
  const graded = roster.filter((e) => e.status === "COMPLETED");
  const points = graded.map((e) => Number(e.gradePoint ?? 0));
  return {
    section,
    roster,
    graded: graded.length,
    ungraded: roster.filter((e) => e.status === "ENROLLED").length,
    averageGradePoint: points.length ? points.reduce((a, b) => a + b, 0) / points.length : null,
  };
}

/** Newest semester first, then course code and section. */
export function sortSections<T extends { section: TeachingSection }>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      b.section.semester.startDate.localeCompare(a.section.semester.startDate) ||
      a.section.course.code.localeCompare(b.section.course.code) ||
      a.section.sectionCode.localeCompare(b.section.sectionCode),
  );
}

/** "CSE101-A Fa26" — the term suffix keeps the same section code apart across semesters. */
export const sectionLabel = (s: TeachingSection) => {
  const [season = "", year = ""] = s.semester.name.split(" ");
  return `${s.course.code}-${s.sectionCode} ${season.slice(0, 2)}${year.slice(-2)}`;
};

/** Runs `fn` over `items` with at most `limit` calls in flight, keeping input order. */
export async function mapWithLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
