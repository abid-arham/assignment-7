"use client";

import { useState } from "react";
import { CalculatorIcon, MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Semester } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";

const MIN = 1;
const MAX = 24;

/** Same arithmetic the API uses for invoices: enrolled credits × the semester's tuition per credit. */
export function FeeCalculator({ semesters }: { semesters: Semester[] }) {
  const [semesterId, setSemesterId] = useState(semesters.find((s) => s.enrollmentOpen)?.id ?? semesters[0]?.id ?? "");
  const [credits, setCredits] = useState(12);
  const semester = semesters.find((s) => s.id === semesterId);
  const rate = Number(semester?.tuitionPerCredit ?? 0);
  const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n));

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <CalculatorIcon className="size-5 text-primary" /> Estimate your tuition
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="calc-semester">Semester</Label>
          <Select value={semesterId} onValueChange={setSemesterId}>
            <SelectTrigger id="calc-semester" className="w-full">
              <SelectValue placeholder="Choose a semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} · {formatMoney(s.tuitionPerCredit)}/credit
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="calc-credits">Credits</Label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => setCredits((c) => clamp(c - 1))} aria-label="Fewer credits">
              <MinusIcon />
            </Button>
            <input
              id="calc-credits"
              type="range"
              min={MIN}
              max={MAX}
              value={credits}
              onChange={(e) => setCredits(clamp(Number(e.target.value)))}
              className="h-2 flex-1 cursor-pointer accent-primary"
            />
            <Button type="button" variant="outline" size="icon" onClick={() => setCredits((c) => clamp(c + 1))} aria-label="More credits">
              <PlusIcon />
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-muted/60 p-5">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {credits} credits × {formatMoney(rate)}
          <span className="block text-xs">A typical full-time load is 12–15 credits (four or five courses).</span>
        </p>
        <p className="font-heading text-4xl font-semibold tabular-nums">{formatMoney(credits * rate)}</p>
      </div>
    </div>
  );
}
