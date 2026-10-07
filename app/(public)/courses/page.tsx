import type { Metadata } from "next";
import { SearchXIcon } from "lucide-react";
import { CatalogShell } from "@/components/site/catalog-shell";
import { CourseCard } from "@/components/site/course-card";
import { EmptyState } from "@/components/shared/empty-state";
import { publicApi } from "@/lib/api/server";
import { courseCatalogSearch, parseSearch } from "@/lib/search-params";

const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "Course catalogue",
  description: "Browse every course offered at Quad by department, with credits, descriptions and prerequisites.",
  openGraph: { title: "Course catalogue · Quad", description: "Browse every course offered at Quad by department." },
};

export default async function CourseCatalogPage({ searchParams }: PageProps<"/courses">) {
  const filters = parseSearch(courseCatalogSearch, await searchParams);
  const [result, departments] = await Promise.all([
    publicApi.courses({ ...filters, limit: PAGE_SIZE }),
    publicApi.departments(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6">
      <header className="max-w-2xl space-y-3">
        <p className="text-sm font-medium tracking-wider text-primary uppercase">Catalogue</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">Find your next course</h1>
        <p className="text-muted-foreground">
          Every course on offer, with credits and prerequisites. Open one to see which semesters it runs in and how
          many seats are left.
        </p>
      </header>

      <CatalogShell departments={departments} total={result.meta.total} pageSize={PAGE_SIZE}>
        {result.items.length === 0 ? (
          <EmptyState
            icon={SearchXIcon}
            title="No courses match your search"
            description="Try another keyword or department — or clear the filters to see the whole catalogue."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((course) => (
              <CourseCard key={course.id} course={course} department={departments.find((d) => d.id === course.departmentId)} />
            ))}
          </div>
        )}
      </CatalogShell>
    </div>
  );
}
