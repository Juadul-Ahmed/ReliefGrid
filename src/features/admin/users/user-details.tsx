
"use client";

import Link from "next/link";

interface UserMembership {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationStatus: string;
  role: string;
  status: string;
  createdAt: Date;
}

interface UserDetailsProps {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    systemRole: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    organizationCount: number;
    memberships: UserMembership[];
  };
  onBack: () => void;
}

export default function UserDetails({
  user,
  onBack,
}: UserDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-secondary"
        >
          ← Back to users
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {user.name.charAt(0).toUpperCase() || "?"}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {user.name}
            </h2>
            <p className="mt-1 text-sm text-muted truncate">
              {user.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                user.systemRole === "SYSTEM_ADMIN"
                  ? "bg-emergency/10 text-emergency"
                  : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {user.systemRole === "SYSTEM_ADMIN" ? "System Admin" : "User"}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Account status
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {user.status === "ACTIVE"
                ? "Active"
                : user.status === "BLOCKED"
                  ? "Blocked"
                  : "Deactivated"}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Email verified
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {user.emailVerified ? "Yes" : "No"}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Registered
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {user.createdAt.toLocaleDateString()}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Last updated
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {user.updatedAt.toLocaleDateString()}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Organization memberships
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {user.organizationCount}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-secondary p-4">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              User ID
            </p>
            <p className="mt-1 text-sm font-medium text-muted truncate">
              {user.id}
            </p>
          </div>
        </div>
      </div>

      {user.memberships.length > 0 && (
        <section className="rounded-xl border border-border bg-surface p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Organization memberships
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-secondary text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-4 font-semibold">Organization</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Joined</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {user.memberships.map((membership) => (
                  <tr
                    key={membership.id}
                    className="transition-colors hover:bg-surface-secondary/50"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/organizations/${membership.organizationId}`}
                        className="font-medium text-foreground"
                      >
                        {membership.organizationName}
                      </Link>
                      <p className="mt-1 text-xs text-muted">
                        /{membership.organizationSlug}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                          membership.role.toLowerCase() === "owner"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : membership.role.toLowerCase() === "admin"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        {membership.role.charAt(0).toUpperCase() + membership.role.slice(1)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                          membership.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {membership.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-muted">
                      {membership.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
