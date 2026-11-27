
"use client";

import { HiOutlineChartBar } from "react-icons/hi2";
import type { ReportsDateRange } from "@/lib/reports/types";

import { ReportsDateFilter } from "./reports-date-filter";

interface ReportsHeaderProps {
  currentRange: ReportsDateRange;
}

export function ReportsHeader({ currentRange }: ReportsHeaderProps) {
  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <HiOutlineChartBar className="size-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Reports &amp; Analytics
          </h1>
        </div>
        <p className="text-sm text-muted">
          Operational insights across incidents, requests, resources, inventory,
          and shelters.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <ReportsDateFilter currentRange={currentRange} />
      </div>
    </section>
  );
}
