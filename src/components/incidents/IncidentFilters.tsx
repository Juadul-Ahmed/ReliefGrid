import Link from "next/link";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

interface IncidentFiltersProps {
  search?: string;
  status?: string;
  severity?: string;
}

const statuses = [
  { value: "OPEN", label: "Open" },
  { value: "ASSESSING", label: "Assessing" },
  { value: "ACTIVE", label: "Active" },
  { value: "CONTAINED", label: "Contained" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "CANCELLED", label: "Cancelled" },
];

const severities = [
  { value: "LOW", label: "Low" },
  { value: "MODERATE", label: "Moderate" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export function IncidentFilters({
  search = "",
  status = "",
  severity = "",
}: IncidentFiltersProps) {
  const hasFilters = Boolean(search || status || severity);

  return (
    <form
      action="/incidents"
      method="GET"
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 lg:flex-row"
    >
      <div className="relative min-w-0 flex-1">
        <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted" />

        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search by title, incident number, or location..."
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <select
        name="status"
        defaultValue={status}
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
      >
        <option value="">All statuses</option>

        {statuses.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <select
        name="severity"
        defaultValue={severity}
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
      >
        <option value="">All severities</option>

        {severities.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
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
          href="/incidents"
          className="flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm transition hover:bg-background"
        >
          Clear
        </Link>
      )}
    </form>
  );
}