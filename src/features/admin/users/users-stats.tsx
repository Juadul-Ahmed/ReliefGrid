
"use client";

import { SkeletonStatCard } from "@/features/skeleton/components";

interface UsersStatsProps {
  total: number;
  active: number;
  blocked: number;
  systemAdmins: number;
  loading?: boolean;
}

export default function UsersStats({
  total,
  active,
  blocked,
  systemAdmins,
  loading = false,
}: UsersStatsProps) {
  const cards = [
    {
      title: "Total Users",
      value: total,
      iconStyle: "bg-info/10 text-info",
    },
    {
      title: "Active Users",
      value: active,
      iconStyle: "bg-success/10 text-success",
    },
    {
      title: "Blocked Users",
      value: blocked,
      iconStyle: blocked > 0 ? "bg-critical/10 text-critical" : "bg-success/10 text-success",
    },
    {
      title: "System Admins",
      value: systemAdmins,
      iconStyle: "bg-emergency/10 text-emergency",
    },
  ];

  if (loading) {
    return (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((_, index) => (
          <SkeletonStatCard key={index} />
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </section>
  );
}

function StatCard({
  title,
  value,
  iconStyle,
}: {
  title: string;
  value: number;
  iconStyle: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </h3>
        </div>
        <div className={`flex size-10 items-center justify-center rounded-xl ${iconStyle}`} />
      </div>
    </div>
  );
}
