import Link from "next/link";

import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { CreateShelterForm } from "@/components/shelters/CreateShelterForm";

export default async function CreateShelterPage() {
  await requireOrganizationPermission("MANAGE_SHELTERS");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/shelters"
          className="text-sm text-muted hover:underline"
        >
          ← Back to shelters
        </Link>

        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Create Shelter
        </h1>

        <p className="mt-1 text-sm text-muted">
          Add a shelter facility to your organization.
        </p>
      </div>

      <CreateShelterForm />
    </div>
  );
}
