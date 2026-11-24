import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const INCIDENT_STATUSES = [
  "OPEN",
  "ASSESSING",
  "ACTIVE",
  "CONTAINED",
  "RESOLVED",
  "CLOSED",
  "SUSPENDED",
  "CANCELLED",
] as const;

export const INCIDENT_SEVERITIES = [
  "LOW",
  "MODERATE",
  "HIGH",
  "CRITICAL",
] as const;

export interface IncidentFilters {
  search?: string;
  status?: string;
  severity?: string;
}

export function getOrganizationIncidentScope(
  organizationId: string,
): Prisma.IncidentWhereInput {
  return {
    OR: [
      { leadOrganizationId: organizationId },
      {
        participants: {
          some: {
            organizationId,
            status: "ACTIVE",
          },
        },
      },
    ],
  };
}

export function buildIncidentFilters(
  organizationId: string,
  filters: IncidentFilters = {},
): Prisma.IncidentWhereInput {
  const search = filters.search?.trim();

  const conditions: Prisma.IncidentWhereInput[] = [
    getOrganizationIncidentScope(organizationId),
  ];

  if (search) {
    conditions.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { incidentNumber: { contains: search, mode: "insensitive" } },
        { locationName: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (
    filters.status &&
    INCIDENT_STATUSES.includes(
      filters.status as (typeof INCIDENT_STATUSES)[number],
    )
  ) {
    conditions.push({
      status: filters.status as (typeof INCIDENT_STATUSES)[number],
    });
  }

  if (
    filters.severity &&
    INCIDENT_SEVERITIES.includes(
      filters.severity as (typeof INCIDENT_SEVERITIES)[number],
    )
  ) {
    conditions.push({
      severity: filters.severity as (typeof INCIDENT_SEVERITIES)[number],
    });
  }

  return { AND: conditions };
}

export async function getIncidents(
  organizationId: string,
  filters: IncidentFilters = {},
) {
  return prisma.incident.findMany({
    where: buildIncidentFilters(organizationId, filters),
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      incidentNumber: true,
      title: true,
      category: true,
      severity: true,
      status: true,
      locationName: true,
      occurredAt: true,
      createdAt: true,
    },
  });
}

export async function getIncidentStats(organizationId: string) {
  const scope = getOrganizationIncidentScope(organizationId);

  const [total, active, critical, resolved] = await Promise.all([
    prisma.incident.count({
      where: scope,
    }),

    prisma.incident.count({
      where: {
        AND: [
          scope,
          {
            status: {
              in: ["OPEN", "ASSESSING", "ACTIVE"],
            },
          },
        ],
      },
    }),

    prisma.incident.count({
      where: {
        AND: [
          scope,
          { severity: "CRITICAL" },
          {
            status: {
              notIn: ["RESOLVED", "CLOSED", "CANCELLED"],
            },
          },
        ],
      },
    }),

    prisma.incident.count({
      where: {
        AND: [scope, { status: "RESOLVED" }],
      },
    }),
  ]);

  return {
    total,
    active,
    critical,
    resolved,
  };
}