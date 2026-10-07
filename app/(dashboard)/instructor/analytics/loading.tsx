import { PageSkeleton } from "@/components/shared/page-skeleton";

export default function Loading() {
  return <PageSkeleton variant="charts" stats={4} />;
}
