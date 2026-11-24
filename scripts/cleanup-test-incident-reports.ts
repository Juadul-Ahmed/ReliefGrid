
import { prisma } from "../src/lib/db/prisma";

const testReportIds = [
  "cmwu7979c0000k4f1u5qy2k6y",
  "cmwu7d8f10000s0f1f6rkw3ok",
  "cmwu7ewmo0000j4f13mcjvo27",
];

async function main() {
  // Confirm all three exact test records still exist.
  const reports = await prisma.incidentReport.findMany({
    where: {
      id: { in: testReportIds },
      title: "Test Flood Emergency Report",
      source: "PUBLIC",
      locationName: "Test Residential Area",
      address: "Test Road, Test District",
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (reports.length !== 3) {
    throw new Error(
      `Safety check failed. Expected 3 reports, found ${reports.length}. Nothing was deleted.`,
    );
  }

  console.table(reports);

  // Execute both deletions atomically.
  const [auditLogs, deletedReports] = await prisma.$transaction([
    prisma.auditLog.deleteMany({
      where: {
        entityType: "IncidentReport",
        entityId: { in: testReportIds },
      },
    }),
    prisma.incidentReport.deleteMany({
      where: {
        id: { in: testReportIds },
        title: "Test Flood Emergency Report",
        source: "PUBLIC",
        locationName: "Test Residential Area",
        address: "Test Road, Test District",
      },
    }),
  ]);

  console.log("Cleanup completed:");
  console.log({
    deletedReports: deletedReports.count,
    deletedAuditLogs: auditLogs.count,
  });
}

main()
  .catch((error) => {
    console.error("Cleanup failed:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
