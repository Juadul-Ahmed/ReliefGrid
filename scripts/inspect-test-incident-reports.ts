
import { prisma } from "../src/lib/db/prisma";

async function main() {
  const reports = await prisma.incidentReport.findMany({
    where: {
      title: "Test Flood Emergency Report",
      source: "PUBLIC",
      locationName: "Test Residential Area",
      address: "Test Road, Test District",
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      description: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log("Matching test reports:");
  console.table(reports);
  console.log(`Total found: ${reports.length}`);
}

main()
  .catch((error) => {
    console.error("Inspection failed:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
