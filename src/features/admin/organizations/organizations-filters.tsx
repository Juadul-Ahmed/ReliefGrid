
"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface OrganizationFiltersProps {
  search: string;
  status: string;
  onChange: (params: { search?: string; status?: string }) => void;
}

export default function OrganizationFilters({
  search,
  status,
  onChange,
}: OrganizationFiltersProps) {
  const router = useRouter();
  const query = useSearchParams();

  const statuses = [
    { value: "ALL", label: "All statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "BLOCKED", label: "Blocked" },
    { value: "PENDING", label: "Pending" },
  ];

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ search: event.target.value });
  };

  const handleStatusChange = (value: string) => {
    onChange({ status: value });
    const params = new URLSearchParams(query);
    if (value === "ALL") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`/admin/organizations?${params.toString()}`);
  };

  const handleClear = () => {
    onChange({ search: "", status: "ALL" });
    router.push("/admin/organizations");
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Organizations
          </h2>
          <p className="mt-1 text-sm text-muted">
            Manage organizations registered across the ReliefGrid platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground lg:hidden"
          >
            <span className="sr-only">Filters</span>
          </button>

          <div className="flex w-full max-w-md flex-col gap-3">
            <div className="relative">
              <input
                type="search"
                name="search"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search by name or owner..."
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              {search && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2 top-2.5 size-5 text-muted"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {statuses.map((item) => {
                const isActive = item.value === status;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleStatusChange(item.value)}
                    aria-pressed={isActive}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface text-muted hover:bg-surface-secondary hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
