
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { AllocationStatusActions } from "@/components/requests/AllocationStatusActions";

function label(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(date: Date | null, fallback = "Not provided") {
  if (!date) return fallback;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 3,
  }).format(value);
}

function statusStyle(status: string) {
  switch (status) {
    case "ALLOCATED":
      return "bg-blue-500/10 text-blue-600";
    case "DISPATCHED":
      return "bg-yellow-500/10 text-yellow-600";
    case "DELIVERED":
      return "bg-green-500/10 text-green-600";
    case "CANCELLED":
      return "bg-red-500/10 text-red-600";
    default:
      return "bg-muted/10 text-muted";
  }
}

interface AllocationRow {
  id: string;
  requestId: string;
  requestItemId: string;
  quantity: string;
  status: string;
  dispatchedAt: Date | null;
  deliveredAt: Date | null;
  trackingReference: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  providerOrganization: { id: string; name: string };
  requestItem: {
    id: string;
    name: string;
    unit: string;
    quantity: string;
    request: {
      id: string;
      requestNumber: string;
      title: string;
      organizationId: string;
      organization: { id: string; name: string };
    };
  };
  items: Array<{
    id: string;
    quantity: string;
    dispatchedQuantity: string;
    deliveredQuantity: string;
    status: string;
    inventoryItemId: string;
  }>;
}

interface AllocationTableProps {
  allocations: AllocationRow[];
  currentOrganizationId: string;
  statusFilter: string;
  canManage: boolean;
}

export function AllocationTable({
  allocations,
  currentOrganizationId,
  statusFilter,
  canManage,
}: AllocationTableProps) {
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState(statusFilter);

  const handleFilterChange = (next: string) => {
    setActiveFilter(next);
    const url = new URL(window.location.href);
    if (next) {
      url.searchParams.set("status", next);
    } else {
      url.searchParams.delete("status");
    }
    router.push(url.toString());
  };

  const filtered = activeFilter
    ? allocations.filter((a) => a.status === activeFilter)
    : allocations;

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-16 text-center">
        <p className="text-sm text-muted">
          {activeFilter
            ? `No allocations with status "${label(activeFilter)}".`
            : "No allocations found for your organization."}
        </p>
        {activeFilter && (
          <button
            type="button"
            onClick={() => handleFilterChange("")}
            className="mt-4 inline-flex rounded-lg border border-border px-4 py-2.5 text-sm transition hover:bg-background"
          >
            Clear filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Your Allocations</h2>
          <p className="mt-0.5 text-sm text-muted">
            {filtered.length} allocation{filtered.length !== 1 ? "s" : ""} provided by your organization.
          </p>
        </div>

        <div className="flex gap-2">
          <select
            value={activeFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">All statuses</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          {activeFilter && (
            <button
              type="button"
              onClick={() => handleFilterChange("")}
              className="rounded-lg border border-border px-3 py-2.5 text-sm transition hover:bg-background"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Allocation List</h2>
          <p className="mt-1 text-sm text-muted">
            All resource allocations where your organization is the provider.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-5 py-3 font-medium">Request</th>
                <th className="px-5 py-3 font-medium">Requested by</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Dispatched / Delivered</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((allocation) => {
                const totalAllocated = allocation.items.reduce(
                  (sum, item) => sum + Number(item.quantity),
                  0,
                );
                const totalDispatched = allocation.items.reduce(
                  (sum, item) => sum + Number(item.dispatchedQuantity),
                  0,
                );
                const totalDelivered = allocation.items.reduce(
                  (sum, item) => sum + Number(item.deliveredQuantity),
                  0,
                );

                const request = allocation.requestItem.request;

                return (
                  <tr
                    key={allocation.id}
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
                        {allocation.trackingReference && (
                          <span className="ml-2"> · Tracking: {allocation.trackingReference}</span>
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {request.organization.name}
                      {request.organizationId === currentOrganizationId && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          YOURS
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      {allocation.items.map((item) => (
                        <div key={item.id} className="text-sm">
                          <p className="font-medium">{Number(item.quantity)} {allocation.requestItem.unit}</p>
                          <p className="text-xs text-muted">{allocation.requestItem.name}</p>
                        </div>
                      ))}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(allocation.status)}`}
                      >
                        {label(allocation.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm">
                        <p className="font-medium">{formatQuantity(totalDispatched)} / {formatQuantity(totalAllocated)}</p>
                        <p className="text-xs text-muted">Dispatched / Allocated</p>
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {formatQuantity(totalDelivered)} delivered
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {formatDate(allocation.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      {canManage && (
                        <AllocationStatusActions
                          allocationId={allocation.id}
                          allocationStatus={allocation.status}
                          items={allocation.items.map((item) => ({
                            id: item.id,
                            quantity: item.quantity,
                            dispatchedQuantity: item.dispatchedQuantity,
                            deliveredQuantity: item.deliveredQuantity,
                            status: item.status,
                            inventoryItemId: item.inventoryItemId,
                          }))}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
