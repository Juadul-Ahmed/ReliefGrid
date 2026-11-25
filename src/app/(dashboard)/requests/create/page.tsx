import Link from "next/link";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { getLinkableIncidents } from "@/lib/requests/queries";
import { CreateEmergencyRequestForm } from "@/components/requests/CreateEmergencyRequestForm";

export default async function CreateEmergencyRequestPage() {
  const { organizationId } = await requireOrganizationPermission(
    "CREATE_EMERGENCY_REQUEST",
  );

  const incidents = await getLinkableIncidents(organizationId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/requests" className="text-sm text-muted hover:underline">
          ← Back to requests
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Create Emergency Request
        </h1>
        <p className="mt-1 text-sm text-muted">
          Request supplies, equipment, or personnel from other organizations.
        </p>
      </div>

      <CreateEmergencyRequestForm incidents={incidents} />
    </div>
  );
}