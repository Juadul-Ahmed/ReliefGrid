
import Link from "next/link";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";

interface RequestRow {
  id: string;
  requestNumber: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  requiredBy: Date | null;
  createdAt: Date;
  organization: {
    id: string;
    name: string;
  };
  incident: {
    id: string;
    incidentNumber: string;
  } | null;
  _count: {
    items: number;
  };
}

interface EmergencyRequestTableProps {
  requests: RequestRow[];
  currentOrganizationId: string;
  hasFilters?: boolean;
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

function priorityStyle(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-500/10 text-red-600";
    case "HIGH":
      return "bg-orange-500/10 text-orange-600";
    case "MEDIUM":
      return "bg-blue-500/10 text-blue-600";
    default:
      return "bg-green-500/10 text-green-600";
  }
}

function statusStyle(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "bg-blue-500/10 text-blue-600";
    case "UNDER_REVIEW":
    case "VERIFIED":
      return "bg-yellow-500/10 text-yellow-600";
    case "IN_PROGRESS":
    case "PARTIALLY_FULFILLED":
      return "bg-yellow-500/10 text-yellow-600";
    case "FULFILLED":
    case "COMPLETED":
      return "bg-green-500/10 text-green-600";
    case "REJECTED":
      return "bg-red-500/10 text-red-600";
    default:
      return "bg-muted/10 text-muted";
  }
}

export function EmergencyRequestTable({
  requests,
  currentOrganizationId,
  hasFilters = false,
}: EmergencyRequestTableProps) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-16 text-center">
        <HiOutlineClipboardDocumentList className="mx-auto size-12 text-muted" />

        <h3 className="mt-4 text-lg font-semibold">
          No emergency requests found
        </h3>

        <p className="mt-2 text-sm text-muted">
          {hasFilters
            ? "Try adjusting your search or filters."
            : "There are no emergency requests visible to your organization yet."}
        </p>

        {!hasFilters && (
          <Link
            href="/requests/create"
            className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Create your first request
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold">Emergency Requests</h2>

        <p className="mt-1 text-sm text-muted">
          {requests.length} request{requests.length !== 1 ? "s" : ""} displayed
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-5 py-3 font-medium">Request</th>
              <th className="px-5 py-3 font-medium">Requested by</th>
              <th className="px-5 py-3 font-medium">Priority</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Required by</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {requests.map((request) => (
              <tr
                key={request.id}
                className="transition hover:bg-background"
              >
                <td className="px-5 py-4">
                  <Link
                    href={`/requests/${request.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {request.title}
                  </Link>

                  <p className="mt-1 text-xs text-muted">
                    {request.requestNumber}
                    {request.incident
                      ? ` · ${request.incident.incidentNumber}`
                      : ""}
                  </p>
                </td>

                <td className="px-5 py-4">
                  {request.organization.name}

                  {request.organization.id === currentOrganizationId && (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      YOURS
                    </span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyle(request.priority)}`}
                  >
                    {label(request.priority)}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(request.status)}`}
                  >
                    {label(request.status)}
                  </span>
                </td>

                <td className="px-5 py-4">
                  {request._count.items}
                </td>

                <td className="whitespace-nowrap px-5 py-4">
                  {request.requiredBy
                    ? request.requiredBy.toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
