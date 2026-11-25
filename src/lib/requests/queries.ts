
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getOrganizationIncidentScope } from "@/lib/incidents/queries";

export const REQUEST_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "IN_PROGRESS",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "COMPLETED",
] as const;

export const REQUEST_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export interface EmergencyRequestFilters {
  search?: string;
  status?: string;
  priority?: string;
}

/**
 * Requests an organization is allowed to see:
 *
 * 1. Requests submitted by its own organization.
 * 2. Requests linked to incidents it leads or actively participates in.
 *
 * Standalone requests remain visible only to their submitting organization.
 * There is no network-wide visibility.
 */
export function getEmergencyRequestScope(
  organizationId: string,
): Prisma.EmergencyRequestWhereInput {
  return {
    OR: [
      { organizationId },
      {
        incident: getOrganizationIncidentScope(organizationId),
      },
    ],
  };
}

export function buildEmergencyRequestFilters(
  organizationId: string,
  filters: EmergencyRequestFilters = {},
): Prisma.EmergencyRequestWhereInput {
  const search = filters.search?.trim();

  const conditions: Prisma.EmergencyRequestWhereInput[] = [
    getEmergencyRequestScope(organizationId),
  ];

  if (search) {
    conditions.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { requestNumber: { contains: search, mode: "insensitive" } },
        { locationName: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (
    filters.status &&
    REQUEST_STATUSES.includes(
      filters.status as (typeof REQUEST_STATUSES)[number],
    )
  ) {
    conditions.push({
      status: filters.status as (typeof REQUEST_STATUSES)[number],
    });
  }

  if (
    filters.priority &&
    REQUEST_PRIORITIES.includes(
      filters.priority as (typeof REQUEST_PRIORITIES)[number],
    )
  ) {
    conditions.push({
      priority: filters.priority as (typeof REQUEST_PRIORITIES)[number],
    });
  }

  return { AND: conditions };
}

export async function getEmergencyRequests(
  organizationId: string,
  filters: EmergencyRequestFilters = {},
) {
  return prisma.emergencyRequest.findMany({
    where: buildEmergencyRequestFilters(organizationId, filters),
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      requestNumber: true,
      title: true,
      category: true,
      priority: true,
      status: true,
      requiredBy: true,
      createdAt: true,

      organization: {
        select: {
          id: true,
          name: true,
        },
      },

      incident: {
        select: {
          id: true,
          incidentNumber: true,
        },
      },

      _count: {
        select: {
          items: true,
        },
      },
    },
  });
}

/**
 * Open incidents the organization can link a new request to.
 * Uses the same incident access scope as request creation.
 */
export async function getLinkableIncidents(organizationId: string) {
  return prisma.incident.findMany({
    where: {
      AND: [
        getOrganizationIncidentScope(organizationId),
        { status: { notIn: ["RESOLVED", "CLOSED", "CANCELLED"] } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      incidentNumber: true,
      title: true,
    },
  });
}
