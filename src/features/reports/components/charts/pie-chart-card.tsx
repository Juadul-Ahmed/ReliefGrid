
"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface PieChartCardProps {
  data: Array<{ name: string; value: number }>;
  title: string;
  description?: string;
  colors?: string[];
  height?: number;
}

export function PieChartCard({
  data,
  title,
  description,
  colors,
  height = 260,
}: PieChartCardProps) {
  const hasData = data.length > 0 && data.some((d) => d.value > 0);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-xs text-muted">{description}</p>
        )}
      </div>
      <div style={{ minHeight: height }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)" }}
            />
            <Legend />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              label
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors?.[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      {total > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-muted">Total</p>
          <p className="text-lg font-bold text-foreground">{total}</p>
        </div>
      )}
      {!hasData && (
        <div className="mt-6 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted">
            No data available for the selected range.
          </p>
        </div>
      )}
    </section>
  );
}
