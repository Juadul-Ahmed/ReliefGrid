import Link from "next/link";
import { HiOutlinePlus } from "react-icons/hi2";
import { requireOrganization } from "@/lib/permissions/organization";
import { hasOrganizationPermission } from "@/lib/permissions/organization-permissions";
import {
  getEmergencyRequests,
  REQUEST_PRIORITIES,
  REQUEST_STATUSES,
} from "@/lib/requests/queries";
import { EmergencyRequestTable } from "@/components/requests/EmergencyRequestTable";

interface RequestsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    priority?: string;
  }>;
}

const selectClass =
  "rounded-lg border border-border bg-background px-3 py-2.5 text-sm";

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const { organizationId, organization, membership } = await requireOrganization();
  const params = await searchParams;

  const requests = await getEmergencyRequests(organizationId, {
    search: params.search,
    status: params.status,
    priority: params.priority,
  });

  const canCreate = hasOrganizationPermission(
    membership.role.toUpperCase(),
    "CREATE_EMERGENCY_REQUEST",
  );
  const hasFilters = Boolean(params.search || params.status || params.priority);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emergency Requests</h1>
          <p className="mt-1 text-sm text-muted">
            Requests for supplies, equipment, and personnel visible to{" "}
            {organization.name}.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/requests/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <HiOutlinePlus className="size-5" />
            Create Request
          </Link>
        )}
      </div>

      <form
        action="/requests"
        method="GET"
        className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 lg:flex-row"
      >
        <input
          type="search"
          name="search"
          defaultValue={params.search ?? ""}
          placeholder="Search by title, request number, or location..."
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />

        <select name="status" defaultValue={params.status ?? ""} className={selectClass}>
          <option value="">All statuses</option>
          {REQUEST_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <select name="priority" defaultValue={params.priority ?? ""} className={selectClass}>
          <option value="">All priorities</option>
          {REQUEST_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
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
            href="/requests"
            className="flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm transition hover:bg-background"
          >
            Clear
          </Link>
        )}
      </form>

      <EmergencyRequestTable
        requests={requests}
        currentOrganizationId={organizationId}
        hasFilters={hasFilters}
      />
    </div>
  );
}