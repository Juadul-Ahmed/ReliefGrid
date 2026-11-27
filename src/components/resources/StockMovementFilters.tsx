import Link from "next/link";

import { STOCK_MOVEMENT_TYPES } from "@/lib/inventory/queries";

interface StockMovementFiltersProps {
  type?: string;
  resourceId?: string;
  actionPath: string;
}

const typeLabels: Record<string, string> = {
  IN: "Stock in",
  OUT: "Stock out",
  RESERVE: "Reserved",
  RELEASE: "Released",
  ADJUST: "Adjustment",
};

export function StockMovementFilters({
  type = "",
  resourceId,
  actionPath,
}: StockMovementFiltersProps) {
  const hasFilters = Boolean(type);

  return (
    <form
      action={actionPath}
      method="GET"
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row"
    >
      {resourceId && (
        <input type="hidden" name="resourceId" value={resourceId} />
      )}

      <select
        name="type"
        defaultValue={type}
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
      >
        <option value="">All movement types</option>

        {STOCK_MOVEMENT_TYPES.map((value) => (
          <option key={value} value={value}>
            {typeLabels[value]}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
      >
        Filter
      </button>

      {hasFilters && (
        <Link
          href={resourceId ? `${actionPath}?resourceId=${resourceId}` : actionPath}
          className="flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm transition hover:bg-background"
        >
          Clear
        </Link>
      )}
    </form>
  );
}