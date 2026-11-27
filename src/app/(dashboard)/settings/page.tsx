
import Link from "next/link";
import {
  HiOutlineCog6Tooth,
  HiOutlineUsers,
  HiOutlineChevronRight,
} from "react-icons/hi2";

import { OrganizationNameEditor } from "@/components/settings/OrganizationNameEditor";
import { requireOrganization } from "@/lib/permissions/organization";

export default async function SettingsPage() {
  const { organization, membership } = await requireOrganization();

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HiOutlineCog6Tooth className="size-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Organization Settings
            </h1>
            <p className="mt-1 text-sm text-muted">
              Manage your organization and its members.
            </p>
          </div>
        </div>
      </div>

      <OrganizationNameEditor
        organization={{ id: organization.id, name: organization.name }}
        membership={{ role: membership.role }}
      />

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">
            Organization Management
          </h2>
          <p className="mt-1 text-sm text-muted">
            Manage access and organization membership.
          </p>
        </div>

        <Link
          href="/settings/members"
          className="flex items-center justify-between gap-4 p-5 transition-colors hover:bg-surface-secondary"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HiOutlineUsers className="size-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">
                Members
              </p>
              <p className="mt-1 text-xs text-muted">
                View members and manage organization invitations.
              </p>
            </div>
          </div>

          <HiOutlineChevronRight className="size-5 shrink-0 text-muted" />
        </Link>
      </section>
    </div>
  );
}
