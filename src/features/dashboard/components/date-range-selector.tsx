
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { DATE_RANGE_OPTIONS, type DateRange } from "@/lib/dashboard/queries";

interface DateRangeSelectorProps {
  onChange?: (range: DateRange) => void;
}

export function DateRangeSelector({ onChange }: DateRangeSelectorProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentRange = (searchParams.get("range") as DateRange) || "30d";

  const handleSelect = (range: DateRange) => {
    const params = new URLSearchParams(searchParams);
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
    onChange?.(range);
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted">Range:</span>
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
