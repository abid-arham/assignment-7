import { cn } from "@/lib/utils";

/** Seats taken vs capacity, coloured as the section fills (amber from 80%, red when full). */
export function SeatMeter({ taken, capacity, className }: { taken: number; capacity: number; className?: string }) {
  const ratio = capacity > 0 ? Math.min(taken / capacity, 1) : 1;
  const left = Math.max(capacity - taken, 0);
  const tone = ratio >= 1 ? "bg-destructive" : ratio >= 0.8 ? "bg-warning" : "bg-success";

  return (
    <div className={cn("space-y-1", className)}>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={taken}
        aria-label={`${taken} of ${capacity} seats taken`}
      >
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${ratio * 100}%` }} />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {left === 0 ? "Full" : `${left} of ${capacity} seats left`}
      </p>
    </div>
  );
}
