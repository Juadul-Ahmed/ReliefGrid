
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireOrganization } from "@/lib/permissions/organization";
import { hasOrganizationPermission } from "@/lib/permissions/organization-permissions";
import { Prisma } from "@/generated/prisma/client";

import { OfferFulfillmentForm } from "@/components/requests/OfferFulfillmentForm";
import { EmergencyRequestReviewPanel } from "@/components/requests/EmergencyRequestReviewPanel";
import { getEmergencyRequestById } from "@/lib/requests/detail-queries";
import { prisma } from "@/lib/db/prisma";
import { MultiAllocateForm } from "@/components/requests/MultiAllocateForm";
import { AllocationStatusActions } from "@/components/requests/AllocationStatusActions";
import {
  COMMITTED_ALLOCATION_STATUSES,
  summarizeFulfillment,
  summarizeRequestFulfillment,
} from "@/lib/requests/fulfillment";

interface RequestDetailsPageProps {
  params: Promise<{ requestId: string }>;
}

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
    case "ALLOCATED":
    case "DISPATCHED":
    case "IN_PROGRESS":
    case "PARTIALLY_FULFILLED":
      return "bg-yellow-500/10 text-yellow-600";
    case "FULFILLED":
    case "COMPLETED":
    case "DELIVERED":
      return "bg-green-500/10 text-green-600";
    case "CANCELLED":
    case "REJECTED":
      return "bg-red-500/10 text-red-600";
    default:
      return "bg-muted/10 text-muted";
  }
}

export default async function EmergencyRequestDetailsPage({
  params,
}: RequestDetailsPageProps) {
  const { requestId } = await params;

  const { organizationId, membership } = await requireOrganization();

  const request = await getEmergencyRequestById(
    requestId,
    organizationId,
  );

  if (!request) {
    notFound();
  }

  const isRequester = request.organizationId === organizationId;

  const role = membership.role.toUpperCase();

  // Participating organizations cannot review another organization's request.
  const canReview =
    isRequester &&
    hasOrganizationPermission(
      role,
      "REVIEW_EMERGENCY_REQUEST",
    ) &&
    (request.status === "SUBMITTED" ||
      request.status === "UNDER_REVIEW");

  // Only authorized external organizations can allocate resources.
  const canRespond =
    !isRequester &&
    request.status === "VERIFIED" &&
    hasOrganizationPermission(
      role,
      "RESPOND_TO_EMERGENCY_REQUEST",
    );

  // Only the provider organization (with the right permission) may manage its
  // own allocations. Non-requesters only ever see their own allocations.
  const canManageAllocations =
    !isRequester &&
    hasOrganizationPermission(role, "RESPOND_TO_EMERGENCY_REQUEST");

  // Fetch active inventory for the current provider organization (only when canRespond)
  const providerInventory = canRespond
    ? await prisma.inventoryItem.findMany({
        where: { organizationId, isActive: true },
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: {
          id: true,
          onHand: true,
          reserved: true,
          resource: { select: { name: true, unit: true, isActive: true } },
        },
      })
    : [];

  const inventoryOptions = providerInventory
    .filter((iv) => iv.resource.isActive)
    .map((iv) => ({
      id: iv.id,
      name: `${iv.resource.name} (${iv.resource.unit})`,
      available: new Prisma.Decimal(iv.onHand).minus(new Prisma.Decimal(iv.reserved)).toString(),
    }));

  // Request-level fulfillment progress derived from allocations.
  const fulfillment = summarizeRequestFulfillment(
    request.items.map((item) => ({
      quantity: item.quantity,
      allocations: item.allocations,
    })),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/requests"
          className="text-sm text-muted hover:underline"
        >
          ← Back to requests
        </Link>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              {request.requestNumber}
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {request.title}
            </h1>

            <p className="mt-1 text-sm text-muted">
              Requested by{" "}
              <span className="font-medium text-foreground">
                {request.organization.name}
              </span>
              {isRequester && " (your organization)"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyle(request.priority)}`}
            >
              {label(request.priority)}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(request.status)}`}
            >
              {label(request.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Fulfillment progress */}
      <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Fulfillment progress</h2>
            <p className="mt-0.5 text-xs text-muted">
              Derived from resource allocations. A request is only fully
              fulfilled once resources are delivered.
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(fulfillment.derivedStatus)}`}
          >
            {label(fulfillment.derivedStatus)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-muted">
          <span>{fulfillment.progress}% delivered</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted/10">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${fulfillment.progress}%` }}
          />
        </div>
      </section>

      {/* Request review */}
      {canReview && (
        <EmergencyRequestReviewPanel
          requestId={request.id}
          status={request.status}
        />
      )}

      {/* Request details */}
      <section className="space-y-5 rounded-xl border border-border bg-surface p-5">
        <div>
          <p className="whitespace-pre-line text-sm leading-6">
            {request.description}
          </p>
        </div>

        <div className="grid gap-4 rounded-lg bg-muted/5 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-muted">Category</p>
            <p className="mt-1 text-sm font-medium">
              {label(request.category)}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted">Required by</p>
            <p className="mt-1 text-sm font-medium">
              {formatDate(request.requiredBy, "No deadline")}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted">Linked incident</p>
            <p className="mt-1 text-sm font-medium">
              {request.incident
                ? `${request.incident.incidentNumber} — ${request.incident.title}`
                : "Standalone request"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted">Delivery location</p>
            <p className="mt-1 text-sm font-medium">
              {request.locationName || "Not specified"}
            </p>

            {request.address && (
              <p className="mt-0.5 text-xs text-muted">
                {request.address}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs text-muted">Submitted by</p>
            <p className="mt-1 text-sm font-medium">
              {request.submittedBy?.name || "Unknown"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted">Created</p>
            <p className="mt-1 text-sm font-medium">
              {formatDate(request.createdAt)}
            </p>
          </div>

          {request.reviewedAt && (
            <div>
              <p className="text-xs text-muted">Reviewed by</p>
              <p className="mt-1 text-sm font-medium">
                {request.reviewedBy?.name || "Unknown"}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {formatDate(request.reviewedAt)}
              </p>
            </div>
          )}

          {request.rejectionReason && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-muted">Rejection reason</p>
              <p className="mt-1 text-sm text-red-600">
                {request.rejectionReason}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Multi-item allocation */}
      {canRespond && request.items.some((i) => i.quantity.toNumber() > 0) && (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">Allocate resources (multi-item)</h2>
          <MultiAllocateForm
            requestId={request.id}
            items={request.items.map((i) => ({ id: i.id, name: i.name, unit: i.unit, quantity: i.quantity.toString() }))}
            inventory={inventoryOptions}
          />
        </section>
      )}

      {/* Requested items */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Requested Items</h2>

          <p className="mt-1 text-sm text-muted">
            {isRequester
              ? "Resource allocations from participating organizations."
              : "Your organization can view and manage its own allocations."}
          </p>
        </div>

        {request.items.map((item) => {
          const summary = summarizeFulfillment(item.quantity, item.allocations);

          const requestedNumber = summary.requested;
          const committedNumber = summary.committed;
          const deliveredNumber = summary.delivered;
          const remainingNumber = summary.remaining;
          const progress = summary.progress;

          const hasActiveAllocation = item.allocations.some(
            (allocation) =>
              allocation.providerOrganizationId === organizationId &&
              COMMITTED_ALLOCATION_STATUSES.includes(
                allocation.status as (typeof COMMITTED_ALLOCATION_STATUSES)[number],
              ),
          );

          const showAllocationForm =
            canRespond &&
            remainingNumber > 0 &&
            !hasActiveAllocation;

  return (
            <article
              key={item.id}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>

                  {item.description && (
                    <p className="mt-1 text-sm text-muted">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted">Requested</p>
                    <p className="mt-0.5 text-sm font-medium">
                      {formatQuantity(requestedNumber)} {item.unit}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted">Committed</p>
                    <p className="mt-0.5 text-sm font-medium">
                      {formatQuantity(committedNumber)} {item.unit}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted">Delivered</p>
                    <p className="mt-0.5 text-sm font-medium">
                      {formatQuantity(deliveredNumber)} {item.unit}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted">Remaining</p>
                    <p className="mt-0.5 text-sm font-medium">
                      {formatQuantity(remainingNumber)} {item.unit}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                  <span>
                    {formatQuantity(deliveredNumber)} of{" "}
                    {formatQuantity(requestedNumber)} {item.unit} delivered
                  </span>

                  <span>{progress}%</span>
                </div>

                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted/10">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Allocations */}
              {item.allocations.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted">
                    {isRequester
                      ? "Resource allocations"
                      : "Your organization's allocations"}
                  </p>

                  {item.allocations.map((allocation) => (
                    <div
                      key={allocation.id}
                      className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {allocation.providerOrganization.name}

                          <span className="ml-2 font-normal text-muted">
                            {formatQuantity(
                              allocation.quantity.toNumber(),
                            )}{" "}
                            {item.unit}
                          </span>
                        </p>

                        <p className="mt-0.5 text-xs text-muted">
                          Allocated {formatDate(allocation.createdAt)}
                        </p>

                        {allocation.trackingReference && (
                          <p className="mt-0.5 text-xs text-muted">
                            Tracking: {allocation.trackingReference}
                          </p>
                        )}

                        {allocation.notes && (
                          <p className="mt-1 text-xs text-muted">
                            {allocation.notes}
                          </p>
                        )}

                        {allocation.dispatchedAt && (
                          <p className="mt-1 text-xs text-muted">
                            Dispatched: {formatDate(allocation.dispatchedAt)}
                          </p>
                        )}

                        {allocation.deliveredAt && (
                          <p className="mt-1 text-xs text-muted">
                            Delivered: {formatDate(allocation.deliveredAt)}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(allocation.status)}`}
                        >
                          {label(allocation.status)}
                        </span>

                        {canManageAllocations &&
                          allocation.providerOrganizationId ===
                            organizationId && (
                            <AllocationStatusActions
                              allocationId={allocation.id}
                              allocationStatus={allocation.status}
                              items={allocation.items}
                            />
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAllocationForm && (
                <OfferFulfillmentForm
                  requestId={request.id}
                  itemId={item.id}
                  unit={item.unit}
                  maxQuantity={remainingNumber}
                />
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
