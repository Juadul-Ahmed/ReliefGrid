
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

  // Filter by incident status.
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

  // Filter by incident severity.
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

export async function getIncidentById(
  incidentId: string,
  organizationId: string,
) {
  return prisma.incident.findFirst({
    where: {
      AND: [
        { id: incidentId },
        getOrganizationIncidentScope(organizationId),
      ],
    },
    select: {
      id: true,
      incidentNumber: true,
      title: true,
      description: true,
      category: true,
      severity: true,
      status: true,

      // Lead organization
      leadOrganizationId: true,

      // Assigned coordinator
      coordinator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      // Location
      locationName: true,
      address: true,
      latitude: true,
      longitude: true,

      // Dates
      occurredAt: true,
      createdAt: true,
      updatedAt: true,
      verifiedAt: true,

      // Creator
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Returns active organizations that can be invited to participate
 * in an incident.
 *
 * The lead organization is excluded.
 */
export async function getAvailableParticipantOrganizations(
  leadOrganizationId: string,
) {
  return prisma.organization.findMany({
    where: {
      status: "ACTIVE",
      id: {
        not: leadOrganizationId,
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Returns participant organizations for an incident.
 *
 * The incident must belong to the supplied lead organization.
 */
export async function getIncidentParticipants(
  incidentId: string,
  leadOrganizationId: string,
) {
  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      leadOrganizationId,
    },
    select: {
      participants: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          joinedAt: true,
          withdrawnAt: true,
          createdAt: true,
          updatedAt: true,

          organization: {
            select: {
              id: true,
              name: true,
            },
          },

          roles: {
            select: {
              role: true,
            },
          },

          invitedBy: {
            select: {
              id: true,
              name: true,
            },
          },

          respondedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return incident?.participants ?? null;
}

/**
 * Returns pending incident invitations addressed to an organization.
 *
 * Only invitations belonging to the supplied organization are returned.
 */
export async function getIncomingIncidentInvitations(
  organizationId: string,
) {
  const now = new Date();

  return prisma.incidentParticipant.findMany({
    where: {
      organizationId,
      status: "INVITED",
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      expiresAt: true,
      createdAt: true,

      incident: {
        select: {
          id: true,
          incidentNumber: true,
          title: true,
          description: true,
          category: true,
          severity: true,
          status: true,
          locationName: true,
          occurredAt: true,

          leadOrganization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },

      roles: {
        select: {
          role: true,
        },
      },

      invitedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
