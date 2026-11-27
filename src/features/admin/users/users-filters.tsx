
"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface UsersFiltersProps {
  search: string;
  status: string;
  role: string;
  onChange: (params: { search?: string; status?: string; role?: string }) => void;
}

export default function UsersFilters({
  search,
  status,
  role,
  onChange,
}: UsersFiltersProps) {
  const router = useRouter();
  const query = useSearchParams();

  const statuses = [
    { value: "ALL", label: "All statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "BLOCKED", label: "Blocked" },
    { value: "DELETED", label: "Deactivated" },
  ];

  const roles = [
    { value: "ALL", label: "All roles" },
    { value: "SYSTEM_ADMIN", label: "System Admin" },
    { value: "USER", label: "User" },
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
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleRoleChange = (value: string) => {
    onChange({ role: value });
    const params = new URLSearchParams(query);
    if (value === "ALL") {
      params.delete("role");
    } else {
      params.set("role", value);
    }
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleClear = () => {
    onChange({ search: "", status: "ALL", role: "ALL" });
    router.push("/admin/users");
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            User Management
          </h2>
          <p className="mt-1 text-sm text-muted">
            Manage platform users and their account access.
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
                placeholder="Search by name or email..."
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
              {roles.map((item) => {
                const isActive = item.value === role;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleRoleChange(item.value)}
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
