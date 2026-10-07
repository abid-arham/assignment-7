import { Skeleton } from "@/components/ui/skeleton";

export default function CourseLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6" aria-busy aria-label="Loading course">
      <Skeleton className="h-7 w-28" />
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-9 w-48 rounded-2xl" />
      </div>
      <Skeleton className="h-32 w-full rounded-3xl" />
      <Skeleton className="h-56 w-full rounded-3xl" />
    </div>
  );
}
