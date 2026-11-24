import { prisma } from "../src/lib/db/prisma";

async function main() {
  const report = await prisma.incidentReport.create({
    data: {
      title: "Test Flood Emergency Report",
      description:
        "Fictional test report for verifying the System Admin review workflow. Heavy rainfall has caused flooding in a residential area.",
      category: "FLOOD",
      severity: "HIGH",
      source: "PUBLIC",
      locationName: "Test Residential Area",
      address: "Test Road, Test District",
      status: "RECEIVED",
    },
  });

  console.log("Test report created:", {
    id: report.id,
    title: report.title,
    status: report.status,
  });
}

main()
  .catch((error) => {
    console.error("Failed to create test report:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });