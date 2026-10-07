"use client";

import { useEffect, useRef, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

/**
 * Search box that reports its value after the user pauses typing. It follows `value` when the URL
 * changes from elsewhere (back button, "clear filters").
 */
export function SearchInput({
  value,
  onSearch,
  placeholder = "Search…",
  label = "Search",
  className,
  delay = 350,
}: {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  delay?: number;
}) {
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, delay);
  const lastSent = useRef(value);

  // External change (e.g. browser back): adopt it without echoing it back.
  useEffect(() => {
    if (value !== lastSent.current) {
      lastSent.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    const next = debounced.trim();
    if (next !== lastSent.current) {
      lastSent.current = next;
      onSearch(next);
    }
  }, [debounced, onSearch]);

  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => setText("")}
          className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
