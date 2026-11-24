
import { prisma } from "@/lib/db/prisma";
import type { IncidentReportStatus } from "@/generated/prisma/enums";

export const INCIDENT_REPORT_STATUSES = [
  "RECEIVED",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "DUPLICATE",
] as const satisfies readonly IncidentReportStatus[];

export interface IncidentReportFilters {
  status?: string;
}

export function getIncidentReportStatus(
  status?: string,
): IncidentReportStatus | undefined {
  return INCIDENT_REPORT_STATUSES.find(
    (item) => item === status,
  );
}

export async function getIncidentReports(
  filters: IncidentReportFilters = {},
) {
  const selectedStatus = getIncidentReportStatus(filters.status);

  return prisma.incidentReport.findMany({
    where: selectedStatus
      ? { status: selectedStatus }
      : {},
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
    select: {
      id: true,
      title: true,
      category: true,
      severity: true,
      status: true,
      createdAt: true,
      submitter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getIncidentReportById(reportId: string) {
  return prisma.incidentReport.findUnique({
    where: {
      id: reportId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      severity: true,
      source: true,
      status: true,
      locationName: true,
      address: true,
      latitude: true,
      longitude: true,
      rejectionReason: true,
      verifiedAt: true,
      createdAt: true,
      updatedAt: true,

      submitter: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },

      verifiedBy: {
        select: {
          name: true,
        },
      },

      duplicateOfReport: {
        select: {
          id: true,
          title: true,
        },
      },

      incident: {
        select: {
          id: true,
          incidentNumber: true,
          title: true,
        },
      },
    },
  });
}
export async function getVerifiedIncidentReports(
  excludeReportId: string,
) {
  return prisma.incidentReport.findMany({
    where: {
      status: "VERIFIED",
      id: {
        not: excludeReportId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
    select: {
      id: true,
      title: true,
    },
  });
}