import Link from "next/link";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

import { RESOURCE_CATEGORIES } from "@/lib/validations/resource.schema";

interface ResourceFiltersProps {
  search?: string;
  category?: string;
}

const categoryLabels: Record<string, string> = {
  FOOD: "Food",
  DRINKING_WATER: "Drinking water",
  MEDICAL_SUPPLIES: "Medical supplies",
  SHELTER: "Shelter",
  RESCUE: "Rescue",
  TRANSPORTATION: "Transportation",
  OTHER: "Other",
};

export function ResourceFilters({
  search = "",
  category = "",
}: ResourceFiltersProps) {
  const hasFilters = Boolean(search || category);

  return (
    <form
      action="/resources"
      method="GET"
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 lg:flex-row"
    >
      <div className="relative min-w-0 flex-1">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />

        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search by name or SKU..."
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <select
        name="category"
        defaultValue={category}
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
      >
        <option value="">All categories</option>

        {RESOURCE_CATEGORIES.map((value) => (
          <option key={value} value={value}>
            {categoryLabels[value]}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        Filter
      </button>

      {hasFilters && (
        <Link
          href="/resources"
          className="flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm transition hover:bg-background"
        >
          Clear
        </Link>
      )}
    </form>
  );
}