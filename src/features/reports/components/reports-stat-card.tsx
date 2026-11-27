
"use client";

import {
  HiOutlineArrowDownRight,
  HiOutlineArrowUpRight,
} from "react-icons/hi2";
import type { IconType } from "react-icons";

interface ReportsStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  trend?: "up" | "down" | "neutral";
  icon: IconType;
  iconStyle?: string;
}

export function ReportsStatCard({
  title,
  value,
  subtitle,
  description,
  trend = "neutral",
  icon,
  iconStyle = "",
}: ReportsStatCardProps) {
  const TrendIcon =
    trend === "up"
      ? HiOutlineArrowUpRight
      : trend === "down"
        ? HiOutlineArrowDownRight
        : null;

  const IconComponent = icon;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </h3>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          {description && (
            <p className="mt-1 text-xs text-muted">{description}</p>
          )}
        </div>

        <div
          className={`flex size-10 items-center justify-center rounded-xl ${iconStyle}`}
        >
          <IconComponent className="size-5" />
        </div>
      </div>

      {TrendIcon && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span
            className={`flex items-center gap-1 font-semibold ${
              trend === "up" ? "text-success" : "text-critical"
            }`}
          >
            <TrendIcon className="size-4" />
            {trend === "up" ? "Increasing" : "Decreasing"}
          </span>
        </div>
      )}
    </div>
  );
}
