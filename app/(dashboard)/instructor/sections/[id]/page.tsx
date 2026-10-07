import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HydrationBoundary } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RosterView } from "@/components/instructor/roster-view";
import { PageHeader } from "@/components/shared/page-header";
import { isApiError } from "@/lib/api/errors";
import { prefetch } from "@/lib/api/prefetch";
import { queries } from "@/lib/api/queries";
import { getSession, serverApi } from "@/lib/api/server";
import { formatDateRange, plural } from "@/lib/format";

const loadSection = (id: string) =>
  serverApi.section(id).catch((error: unknown) => {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  });

export async function generateMetadata({ params }: PageProps<"/instructor/sections/[id]">): Promise<Metadata> {
  const section = await loadSection((await params).id);
  return { title: `${section.course.code}-${section.sectionCode} roster` };
}

export default async function SectionRosterPage({ params }: PageProps<"/instructor/sections/[id]">) {
  const { id } = await params;
  const [section, session] = await Promise.all([loadSection(id), getSession()]);
  // Only the assigned instructor may see a roster (the API enforces this too).
  if (section.instructorId !== session?.userId) notFound();

  const state = await prefetch((qc) => qc.prefetchQuery(queries.roster(serverApi, id)));

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link href="/instructor">
          <ArrowLeftIcon /> All sections
        </Link>
      </Button>
      <PageHeader
        eyebrow={`${section.semester.name} · Section ${section.sectionCode}`}
        title={`${section.course.code} · ${section.course.title}`}
        description={`${plural(section.course.credits, "credit")} · ${section.enrolledCount}/${section.capacity} seats · ${formatDateRange(section.semester.startDate, section.semester.endDate)}`}
      />
      <HydrationBoundary state={state}>
        <RosterView sectionId={id} />
      </HydrationBoundary>
    </>
  );
}
