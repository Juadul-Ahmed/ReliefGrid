
"use client";

import Link from "next/link";
import { useTransition } from "react";
import { HiOutlineArrowLeft, HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { toast } from "react-toastify";

import {
  blockOrganization,
  deleteOrganization,
  unblockOrganization,
} from "@/app/actions/admin-organizations";
import ApplicationConfirmationDialog from "@/components/admin/applications/details/ApplicationConfirmationDialog";
import OrganizationStatusBadge from "@/features/admin/organizations/organization-status-badge";

interface OrganizationMember {
  id: string;
  role: string;
  status: string;
  user: { id: string; name: string | null; email: string | null };
}

interface OrganizationDetailsProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    logo: string | null;
    metadata: string | null;
    owner: { name: string | null; email: string | null } | null;
    memberCount: number;
    members: OrganizationMember[];
  };
}

export default function OrganizationDetails({
  organization,
}: OrganizationDetailsProps) {
  const [isPending, startTransition] = useTransition();
  const isBlocked = organization.status === "BLOCKED";

  const handleBlock = async () => {
    startTransition(async () => {
      const result = await blockOrganization({
        organizationId: organization.id,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleUnblock = async () => {
    startTransition(async () => {
      const result = await unblockOrganization({
        organizationId: organization.id,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteOrganization({
        organizationId: organization.id,
        reason: "Requested by system administrator from organization details page.",
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Not provided";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/organizations"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
          >
            <HiOutlineArrowLeft className="size-4" />
            Back to Organizations
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HiOutlineBuildingOffice2 className="size-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {organization.name}
              </h1>
              <p className="mt-1 text-sm text-muted">
                /{organization.slug}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <OrganizationStatusBadge status={organization.status} />
        </div>
      </div>

      {/* Organization information */}
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Organization Information
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 rounded-xl bg-surface-secondary">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Status
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {organization.status.charAt(0).toUpperCase() +
                organization.status.slice(1)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-secondary">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Created
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatDate(organization.createdAt)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-secondary">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Last Updated
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatDate(organization.updatedAt)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-secondary">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Total Members
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {organization.memberCount}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-secondary">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Owner
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {organization.owner?.name || "No owner assigned"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {organization.owner?.email || "-"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-secondary">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Slug
            </p>
            <p className="mt-1 break-all text-sm font-medium text-foreground">
              {organization.slug}
            </p>
          </div>
        </div>
      </section>

      {/* Members */}
      <section className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Members ({organization.memberCount})
            </h2>
            <p className="mt-1 text-sm text-muted">
              Organization members and their roles.
            </p>
          </div>
        </div>

        {organization.members.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-muted">
              No members found for this organization.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {organization.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {member.user.name?.charAt(0).toUpperCase() ||
                    member.user.email?.charAt(0).toUpperCase() || "?"}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {member.user.name || "Unnamed user"}
                  </p>
                  <p className="text-xs text-muted">
                    {member.user.email}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      member.role.toUpperCase() === "OWNER"
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-secondary text-muted"
                    }`}
                  >
                    {member.role.charAt(0).toUpperCase() +
                      member.role.slice(1)}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      member.status === "ACTIVE"
                        ? "bg-green-500/10 text-green-600"
                        : "bg-surface-secondary text-muted"
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-5">
          Organization Actions
        </h2>

        <div className="flex flex-wrap gap-3">
          {isBlocked ? (
            <ApplicationConfirmationDialog
              title={`Unblock "${organization.name}"?`}
              description={`Unblocking will restore "${organization.name}" to active status.`}
              confirmLabel="Unblock"
              variant="primary"
              isDisabled={isPending}
              onConfirm={handleUnblock}
            />
          ) : (
            <ApplicationConfirmationDialog
              title={`Block "${organization.name}"?`}
              description={`Blocking will suspend "${organization.name}" and prevent its members from performing protected organization operations.`}
              confirmLabel="Block"
              variant="danger"
              isDisabled={isPending}
              onConfirm={handleBlock}
            />
          )}
          <ApplicationConfirmationDialog
            title={`Request deletion of "${organization.name}"?`}
            description={`Deletion may permanently remove organization-related data. This action goes through the protected deletion-request workflow.`}
            confirmLabel="Request Deletion"
            variant="danger"
            iconStatus="danger"
            isDisabled={isPending}
            onConfirm={handleDelete}
          />
          <Link
            href="/admin/organizations"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-secondary"
          >
            <span className="size-4">Back</span>
          </Link>
        </div>

        {isPending && (
          <p className="mt-4 text-sm text-muted">
            Processing... Please wait.
          </p>
        )}
      </section>
    </div>
  );
}
