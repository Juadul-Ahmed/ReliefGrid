
"use client";

import Link from "next/link";
import { HiOutlineEye } from "react-icons/hi2";

import ApplicationConfirmationDialog from "@/components/admin/applications/details/ApplicationConfirmationDialog";
import OrganizationStatusBadge from "@/features/admin/organizations/organization-status-badge";

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: Date;
  owner: { name: string | null; email: string | null } | null;
  memberCount: number;
}

interface OrganizationsTableProps {
  organizations: OrganizationRow[];
  onBlock: (id: string) => void;
  onUnblock: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function OrganizationsTable({
  organizations,
  onBlock,
  onUnblock,
  onDelete,
}: OrganizationsTableProps) {
  if (organizations.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-5 py-16 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-surface-secondary">
          <HiOutlineEye className="size-7 text-muted" />
        </div>

        <h3 className="mt-4 font-semibold text-foreground">
          No organizations found
        </h3>

        <p className="mt-2 text-sm text-muted">
          Organizations will appear here once registered on the platform.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-secondary text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-4 font-semibold">Organization</th>
              <th className="px-5 py-4 font-semibold">Owner</th>
              <th className="px-5 py-4 font-semibold">Members</th>
              <th className="px-5 py-4 font-semibold">Created</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {organizations.map((org) => (
              <tr
                key={org.id}
                className="transition-colors hover:bg-surface-secondary/50"
              >
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/organizations/${org.id}`}
                    className="font-medium text-foreground"
                  >
                    {org.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    /{org.slug}
                  </p>
                </td>

                <td className="px-5 py-4">
                  {org.owner ? (
                    <>
                      <p className="font-medium text-foreground">
                        {org.owner.name || "Unnamed owner"}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {org.owner.email}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted">No owner</p>
                  )}
                </td>

                <td className="px-5 py-4 text-muted">
                  {org.memberCount}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-muted">
                  {org.createdAt.toLocaleDateString()}
                </td>

                <td className="px-5 py-4">
                  <OrganizationStatusBadge status={org.status} />
                </td>

                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {org.status === "BLOCKED" ? (
                      <OrganizationActionDialog
                        action="unblock"
                        organizationName={org.name}
                        onConfirm={() => onUnblock(org.id)}
                      />
                    ) : (
                      <OrganizationActionDialog
                        action="block"
                        organizationName={org.name}
                        onConfirm={() => onBlock(org.id)}
                      />
                    )}
                    <OrganizationActionDialog
                      action="delete"
                      organizationName={org.name}
                      onConfirm={() => onDelete(org.id)}
                      variant="danger"
                      iconStatus="danger"
                    />
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-secondary"
                    >
                      <HiOutlineEye className="size-4" />
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border px-5 py-3">
        <p className="text-xs text-muted">
          Showing {organizations.length}{" "}
          {organizations.length === 1 ? "organization" : "organizations"}
        </p>
      </div>
    </div>
  );
}

interface OrganizationActionDialogProps {
  action: "block" | "unblock" | "delete";
  organizationName: string;
  variant?: "primary" | "danger";
  iconStatus?: "danger";
  onConfirm: () => void;
}

function OrganizationActionDialog({
  action,
  organizationName,
  variant = "primary",
  iconStatus,
  onConfirm,
}: OrganizationActionDialogProps) {
  const isDelete = action === "delete";
  const isBlock = action === "block";

  return (
    <ApplicationConfirmationDialog
      title={
        isDelete
          ? `Delete "${organizationName}"?`
          : isBlock
            ? `Block "${organizationName}"?`
            : `Unblock "${organizationName}"?`
      }
      description={
        isDelete
          ? `Deletion may permanently remove organization-related data. This action goes through the protected deletion-request workflow.`
          : isBlock
            ? `Blocking will suspend "${organizationName}" and prevent its members from performing protected organization operations.`
            : `Unblocking will restore "${organizationName}" to active status.`
      }
      confirmLabel={
        isDelete ? "Request Deletion" : isBlock ? "Block" : "Unblock"
      }
      variant={variant}
      iconStatus={iconStatus}
      onConfirm={onConfirm}
    />
  );
}
