
import { HiOutlineUsers } from "react-icons/hi2";

import { OrganizationInvitationForm } from "@/components/organization/OrganizationInvitationForm";
import { prisma } from "@/lib/db/prisma";
import { requireOrganization } from "@/lib/permissions/organization";

export default async function MembersPage() {
  const { organizationId, membership, organization } =
    await requireOrganization();

  const currentRole = membership.role.toUpperCase();
  const canInvite = currentRole === "OWNER" || currentRole === "ADMIN";

  const members = await prisma.member.findMany({
    where: {
      organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Page heading */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HiOutlineUsers className="size-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Organization Members
            </h1>
            <p className="mt-1 text-sm text-muted">
              Manage access to {organization.name}.
            </p>
          </div>
        </div>
      </div>

      {/* Member list */}
      <section className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-semibold text-foreground">
              Members
            </h2>
            <p className="mt-1 text-xs text-muted">
              {members.length} organization{" "}
              {members.length === 1 ? "member" : "members"}
            </p>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <HiOutlineUsers className="mx-auto size-9 text-muted" />
            <p className="mt-3 text-sm font-medium text-foreground">
              No members found
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {members.map((member) => {
              const isActive = member.status === "ACTIVE";
              const role = member.role.toUpperCase();

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {member.user.name?.charAt(0).toUpperCase() ||
                        member.user.email.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {member.user.name || "Unnamed user"}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {member.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-[52px] sm:pl-0">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {role === "OWNER"
                        ? "Owner"
                        : role === "ADMIN"
                          ? "Administrator"
                          : "Member"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        isActive
                          ? "bg-green-500/10 text-green-600"
                          : "bg-surface-secondary text-muted"
                      }`}
                    >
                      {isActive ? "Active" : member.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Invitation form */}
      {canInvite ? (
        <OrganizationInvitationForm />
      ) : (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold text-foreground">
            Invite a member
          </h2>
          <p className="mt-1 text-sm text-muted">
            Only organization owners and administrators can invite new members.
          </p>
        </section>
      )}
    </div>
  );
}
