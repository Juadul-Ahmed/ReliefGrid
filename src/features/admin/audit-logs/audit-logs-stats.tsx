
"use client";

import { SkeletonStatCard } from "@/features/skeleton/components";

interface AuditLogsStatsProps {
  totalEvents: number;
  eventsToday: number;
  eventsLast7Days: number;
  distinctActors: number;
  loading?: boolean;
}

export default function AuditLogsStats({
  totalEvents,
  eventsToday,
  eventsLast7Days,
  distinctActors,
  loading = false,
}: AuditLogsStatsProps) {
  const cards = [
    {
      title: "Total Events",
      value: totalEvents,
      iconStyle: "bg-info/10 text-info",
    },
    {
      title: "Events Today",
      value: eventsToday,
      iconStyle: "bg-success/10 text-success",
    },
    {
      title: "Events Last 7 Days",
      value: eventsLast7Days,
      iconStyle: eventsLast7Days > 0 ? "bg-emergency/10 text-emergency" : "bg-success/10 text-success",
    },
    {
      title: "Distinct Actors",
      value: distinctActors,
      iconStyle: "bg-primary/10 text-primary",
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
