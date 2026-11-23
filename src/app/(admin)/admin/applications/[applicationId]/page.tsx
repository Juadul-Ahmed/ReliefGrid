
import { notFound } from "next/navigation";

import ApplicationDetailsHeader from "@/components/admin/applications/details/ApplicationDetailsHeader";
import ApplicationInfoCard from "@/components/admin/applications/details/ApplicationInfoCard";
import ApplicationReviewCard from "@/components/admin/applications/details/ApplicationReviewCard";
import ApplicationReviewActions from "@/components/admin/applications/details/ApplicationReviewActions";
import { prisma } from "@/lib/db/prisma";

interface ApplicationDetailsPageProps {
  params: Promise<{
    applicationId: string;
  }>;
}

export default async function ApplicationDetailsPage({
  params,
}: ApplicationDetailsPageProps) {
  const { applicationId } = await params;

  const application = await prisma.organizationApplication.findUnique({
    where: { id: applicationId },
    include: {
      applicant: {
        select: {
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
  });

  if (!application) {
    notFound();
  }

  const reviewer = application.reviewedById
    ? await prisma.user.findUnique({
        where: { id: application.reviewedById },
        select: { name: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <ApplicationDetailsHeader status={application.status} />

      <ApplicationInfoCard
        organization={{
          name: application.organizationName,
          slug: application.requestedSlug,
          type: application.organizationType,
          description: application.description,
          address: application.address,
          contactEmail: application.contactEmail,
          contactPhone: application.contactPhone,
        }}
        applicant={application.applicant}
      />

      <ApplicationReviewCard
        submittedAt={application.createdAt}
        updatedAt={application.updatedAt}
        reviewedBy={reviewer?.name ?? null}
        reviewedAt={application.reviewedAt}
        reviewNotes={application.reviewNotes}
      />

      <ApplicationReviewActions
        applicationId={application.id}
        status={application.status}
      />
    </div>
  );
}
