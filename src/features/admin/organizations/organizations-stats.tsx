
"use client";

import { SkeletonStatCard } from "@/features/skeleton/components";

interface OrganizationStatsProps {
  total: number;
  active: number;
  blocked: number;
  members: number;
  loading?: boolean;
}

export default function OrganizationStats({
  total,
  active,
  blocked,
  members,
  loading = false,
}: OrganizationStatsProps) {
  const cards = [
    {
      title: "Total Organizations",
      value: total,
      icon: null,
      iconStyle: "bg-info/10 text-info",
    },
    {
      title: "Active Organizations",
      value: active,
      icon: null,
      iconStyle: "bg-success/10 text-success",
    },
    {
      title: "Blocked Organizations",
      value: blocked,
      icon: null,
      iconStyle: blocked > 0 ? "bg-critical/10 text-critical" : "bg-success/10 text-success",
    },
    {
      title: "Total Members",
      value: members,
      icon: null,
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
  icon,
  iconStyle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
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
        <div className={`flex size-10 items-center justify-center rounded-xl ${iconStyle}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
