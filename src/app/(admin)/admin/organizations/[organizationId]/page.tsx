
import { notFound } from "next/navigation";

import { getOrganizationDetails } from "@/app/actions/admin-organizations";
import OrganizationDetails from "@/features/admin/organizations/organization-details";

interface OrganizationDetailsPageProps {
  params: Promise<{
    organizationId: string;
  }>;
}

export default async function OrganizationDetailsPage({
  params,
}: OrganizationDetailsPageProps) {
  const { organizationId } = await params;

  const { organization } = await getOrganizationDetails(organizationId);

  if (!organization) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <OrganizationDetails organization={organization} />
    </div>
  );
}
