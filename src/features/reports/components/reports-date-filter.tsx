
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { DATE_RANGE_OPTIONS, type ReportsDateRange } from "@/lib/reports/types";

interface ReportsDateFilterProps {
  currentRange: ReportsDateRange;
  onChange?: (range: ReportsDateRange) => void;
}

export function ReportsDateFilter({
  currentRange,
  onChange,
}: ReportsDateFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleSelect = (range: ReportsDateRange) => {
    const params = new URLSearchParams(searchParams);
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
    onChange?.(range);
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-semibold text-muted uppercase tracking-wider">
        Range:
      </span>
      {DATE_RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => handleSelect(option.value)}
          className={`px-2.5 py-1 text-xs rounded-md border ${
            currentRange === option.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-surface text-muted border-border hover:bg-surface-secondary"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
