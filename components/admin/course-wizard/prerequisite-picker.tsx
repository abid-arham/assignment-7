"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";
import { queries } from "@/lib/api/queries";

export const ALL_COURSES = { limit: 100, sortBy: "code" } as const;

/** Searchable checklist of existing courses; selected ones show as removable chips. */
export function PrerequisitePicker({
  value,
  onChange,
  excludeIds = [],
  max = 5,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  excludeIds?: string[];
  max?: number;
}) {
  const [search, setSearch] = useState("");
  const { data, isPending } = useQuery(queries.courses(api, ALL_COURSES));
  const courses = (data?.items ?? []).filter((c) => !excludeIds.includes(c.id));
  const needle = search.trim().toLowerCase();
  const visible = courses.filter(
    (c) => !needle || c.code.toLowerCase().includes(needle) || c.title.toLowerCase().includes(needle),
  );
  const selected = courses.filter((c) => value.includes(c.id));

  const toggle = (id: string, on: boolean) =>
    onChange(on ? [...value, id].slice(0, max) : value.filter((v) => v !== id));

  return (
    <div className="space-y-3">
      <div className="flex min-h-7 flex-wrap gap-1.5" aria-live="polite">
        {selected.length === 0 ? (
          <p className="text-sm text-muted-foreground">No prerequisites — any student can register.</p>
        ) : (
          selected.map((c) => (
            <Badge key={c.id} variant="secondary" className="h-6 gap-1 pr-1">
              {c.code}
              <button
                type="button"
                onClick={() => toggle(c.id, false)}
                className="rounded-full p-0.5 hover:bg-background"
                aria-label={`Remove ${c.code}`}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter courses"
          className="pl-8"
          aria-label="Filter prerequisite courses"
        />
      </div>
      <ScrollArea className="h-60 rounded-xl border">
        {isPending ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">No courses match “{search}”.</p>
        ) : (
          <ul className="divide-y">
            {visible.map((c) => {
              const checked = value.includes(c.id);
              const disabled = !checked && value.length >= max;
              return (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/50 has-disabled:cursor-not-allowed has-disabled:opacity-50">
                    <Checkbox checked={checked} disabled={disabled} onCheckedChange={(on) => toggle(c.id, on === true)} />
                    <span className="min-w-0 text-sm">
                      <span className="font-medium">{c.code}</span>{" "}
                      <span className="text-muted-foreground">{c.title}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
      <p className="text-xs text-muted-foreground">
        {value.length}/{max} selected. Circular chains are rejected by the server.
      </p>
    </div>
  );
}
