import Link from "next/link";

import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { CreateResourceForm } from "@/components/resources/CreateResourceForm";

export default async function CreateResourcePage() {
  await requireOrganizationPermission("MANAGE_RESOURCES");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/resources"
          className="text-sm text-muted hover:underline"
        >
          ← Back to resources
        </Link>

        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Create Resource
        </h1>

        <p className="mt-1 text-sm text-muted">
          Add a resource to your organization&apos;s catalog.
        </p>
      </div>

      <CreateResourceForm />
    </div>
  );
}