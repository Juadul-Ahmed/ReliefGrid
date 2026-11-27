
"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface AuditLogsFiltersProps {
  search: string;
  action: string;
  organizationId: string;
  entityType: string;
  startDate: string;
  endDate: string;
  onChange: (params: {
    search?: string;
    action?: string;
    organizationId?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
}

export default function AuditLogsFilters({
  search,
  action,
  organizationId,
  entityType,
  startDate,
  endDate,
  onChange,
}: AuditLogsFiltersProps) {
  const router = useRouter();
  const query = useSearchParams();

  const actions = [
    { value: "", label: "All actions" },
    { value: "USER_CREATED", label: "User Created" },
    { value: "USER_BLOCKED", label: "User Blocked" },
    { value: "USER_UNBLOCKED", label: "User Unblocked" },
    { value: "USER_DELETED", label: "User Deleted" },
    { value: "ORGANIZATION_BLOCKED", label: "Organization Blocked" },
    { value: "ORGANIZATION_UNBLOCKED", label: "Organization Unblocked" },
    { value: "ORGANIZATION_DELETED", label: "Organization Deleted" },
    { value: "EMERGENCY_RESOURCE_ALLOCATED", label: "Resource Allocated" },
  ];

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ search: event.target.value });
  };

  const handleActionChange = (value: string) => {
    onChange({ action: value });
    const params = new URLSearchParams(query);
    if (value === "") {
      params.delete("action");
    } else {
      params.set("action", value);
    }
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const handleOrganizationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ organizationId: event.target.value });
    const params = new URLSearchParams(query);
    if (event.target.value === "") {
      params.delete("organizationId");
    } else {
      params.set("organizationId", event.target.value);
    }
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const handleEntityTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ entityType: event.target.value });
    const params = new URLSearchParams(query);
    if (event.target.value === "") {
      params.delete("entityType");
    } else {
      params.set("entityType", event.target.value);
    }
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const handleStartDateChange = (value: string) => {
    onChange({ startDate: value });
    const params = new URLSearchParams(query);
    if (value === "") {
      params.delete("startDate");
    } else {
      params.set("startDate", value);
    }
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const handleEndDateChange = (value: string) => {
    onChange({ endDate: value });
    const params = new URLSearchParams(query);
    if (value === "") {
      params.delete("endDate");
    } else {
      params.set("endDate", value);
    }
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const handleClear = () => {
    onChange({
      search: "",
      action: "",
      organizationId: "",
      entityType: "",
      startDate: "",
      endDate: "",
    });
    router.push("/admin/audit-logs");
  };

  const hasActiveFilters =
    search !== "" ||
    action !== "" ||
    organizationId !== "" ||
    entityType !== "" ||
    startDate !== "" ||
    endDate !== "";

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Audit Logs
          </h2>
          <p className="mt-1 text-sm text-muted">
            Review and investigate platform activity.
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <input
                  type="search"
                  name="search"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search by actor name or email..."
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

              <div className="relative">
                <select
                  value={action}
                  onChange={(e) => handleActionChange(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  {actions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="organizationId"
                  value={organizationId}
                  onChange={handleOrganizationChange}
                  placeholder="Organization ID..."
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="entityType"
                  value={entityType}
                  onChange={handleEntityTypeChange}
                  placeholder="Entity type (e.g. User)..."
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="relative">
                <input
                  type="date"
                  name="startDate"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="relative">
                <input
                  type="date"
                  name="endDate"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
