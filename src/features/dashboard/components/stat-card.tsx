
import {
  HiOutlineArrowDownRight,
  HiOutlineArrowUpRight,
} from "react-icons/hi2";

import type { DashboardStat } from "../types/dashboard.types";

interface StatCardProps {
  stat: DashboardStat;
}

export function StatCard({ stat }: StatCardProps) {
  const Icon = stat.icon;

  const TrendIcon =
    stat.trend === "up"
      ? HiOutlineArrowUpRight
      : HiOutlineArrowDownRight;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">
            {stat.title}
          </p>

          <h3 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {stat.value}
          </h3>
        </div>

        <div
          className={`flex size-11 items-center justify-center rounded-xl ${stat.iconStyle}`}
        >
          <Icon className="size-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs">
        <span
          className={`flex items-center gap-1 font-semibold ${
            stat.trend === "up"
              ? "text-success"
              : "text-critical"
          }`}
        >
          <TrendIcon className="size-4" />
          {stat.change}
        </span>

        <span className="text-muted">
          {stat.description}
        </span>
      </div>
    </div>
  );
}
