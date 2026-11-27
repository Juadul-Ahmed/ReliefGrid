
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface LineChartCardProps {
  data: Array<{ name: string; value: number }>;
  title: string;
  description?: string;
  color?: string;
  height?: number;
}

export function LineChartCard({
  data,
  title,
  description,
  color = "var(--color-success)",
  height = 260,
}: LineChartCardProps) {
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
          <LineChart
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
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
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
