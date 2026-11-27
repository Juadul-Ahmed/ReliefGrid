
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface BarChartCardProps {
  data: Array<{ name: string; value: number }>;
  title: string;
  description?: string;
  colors?: string[];
  height?: number;
  hideLegend?: boolean;
}

export function BarChartCard({
  data,
  title,
  description,
  colors,
  height = 260,
  hideLegend = false,
}: BarChartCardProps) {
  const hasData = data.length > 0 && data.some((d) => d.value > 0);

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
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-muted)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => String(Math.round(value))}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)" }}
            />
            {!hideLegend && <Legend />}
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors?.[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
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
