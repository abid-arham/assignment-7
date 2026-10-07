import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentLoading() {
  return (
    <div className="w-full max-w-md space-y-4 rounded-3xl border bg-card p-8" aria-busy aria-label="Confirming payment">
      <Skeleton className="mx-auto size-14 rounded-full" />
      <Skeleton className="mx-auto h-7 w-56" />
      <Skeleton className="mx-auto h-4 w-72 max-w-full" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-9 w-full rounded-2xl" />
    </div>
  );
}
