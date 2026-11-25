
import type { DashboardStat } from "../types/dashboard.types";
import { StatCard } from "./stat-card";

interface DashboardStatsProps {
  stats: DashboardStat[];
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <section
      aria-label="Operational statistics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {stats.map((stat) => (
        <StatCard key={stat.title} stat={stat} />
      ))}
    </section>
  );
}
