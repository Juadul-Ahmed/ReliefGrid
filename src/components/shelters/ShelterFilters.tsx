"use client";

import Link from "next/link";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

interface ShelterFiltersProps {
  search?: string;
  status?: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "CLOSED", label: "Closed" },
];

export function ShelterFilters({
  search = "",
  status = "",
}: ShelterFiltersProps) {
  const hasFilters = Boolean(search || status);

  return (
    <form
      action="/shelters"
      method="GET"
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 lg:flex-row"
    >
      <div className="relative min-w-0 flex-1">
        <HiOutlineMagnifyingGlass
          className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
        />

        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search by name or address..."
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <select
        name="status"
        defaultValue={status}
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
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
          href="/shelters"
          className="flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm transition hover:bg-background"
        >
          Clear
        </Link>
      )}
    </form>
  );
}
