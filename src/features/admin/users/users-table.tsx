
"use client";

import { HiOutlineEye } from "react-icons/hi2";

import ApplicationConfirmationDialog from "@/components/admin/applications/details/ApplicationConfirmationDialog";
import UserStatusBadge from "@/features/admin/users/user-status-badge";

interface UserRow {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  systemRole: string;
  status: string;
  createdAt: Date;
  organizationCount: number;
}

interface UsersTableProps {
  users: UserRow[];
  currentUserId: string;
  onBlock: (id: string) => void;
  onUnblock: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export default function UsersTable({
  users,
  currentUserId,
  onBlock,
  onUnblock,
  onDelete,
  onView,
}: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-5 py-16 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-surface-secondary">
          <HiOutlineEye className="size-7 text-muted" />
        </div>

        <h3 className="mt-4 font-semibold text-foreground">
          No users found
        </h3>

        <p className="mt-2 text-sm text-muted">
          Users will appear here once registered on the platform.
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
              <th className="px-5 py-4 font-semibold">User</th>
              <th className="px-5 py-4 font-semibold">Account status</th>
              <th className="px-5 py-4 font-semibold">Role</th>
              <th className="px-5 py-4 font-semibold">Organizations</th>
              <th className="px-5 py-4 font-semibold">Joined</th>
              <th className="px-5 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr
                key={user.id}
                className="transition-colors hover:bg-surface-secondary/50"
              >
                <td className="px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {user.name}
                    </p>
                    <p className="mt-1 text-xs text-muted truncate">
                      {user.email}
                    </p>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <UserStatusBadge status={user.status} />
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                      user.systemRole === "SYSTEM_ADMIN"
                        ? "bg-emergency/10 text-emergency"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {user.systemRole === "SYSTEM_ADMIN"
                      ? "System Admin"
                      : "User"}
                  </span>
                </td>

                <td className="px-5 py-4 text-muted">
                  {user.organizationCount}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-muted">
                  {user.createdAt.toLocaleDateString()}
                </td>

                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <UserActionDialog
                      action={user.status === "BLOCKED" ? "unblock" : "block"}
                      userName={user.name}
                      userEmail={user.email}
                      isDisabled={user.id === currentUserId}
                      onConfirm={() =>
                        user.status === "BLOCKED"
                          ? onUnblock(user.id)
                          : onBlock(user.id)
                      }
                    />
                    <UserActionDialog
                      action="delete"
                      userName={user.name}
                      userEmail={user.email}
                      isDisabled={user.id === currentUserId}
                      variant="danger"
                      iconStatus="danger"
                      onConfirm={() => onDelete(user.id)}
                    />
                    <button
                      type="button"
                      onClick={() => onView(user.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={user.id === currentUserId}
                    >
                      <HiOutlineEye className="size-4" />
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border px-5 py-3">
        <p className="text-xs text-muted">
          Showing {users.length}{" "}
          {users.length === 1 ? "user" : "users"}
        </p>
      </div>
    </div>
  );
}

interface UserActionDialogProps {
  action: "block" | "unblock" | "delete";
  userName: string;
  userEmail: string;
  variant?: "primary" | "danger";
  iconStatus?: "danger";
  isDisabled?: boolean;
  onConfirm: () => void;
}

function UserActionDialog({
  action,
  userName,
  userEmail,
  variant = "primary",
  iconStatus,
  isDisabled = false,
  onConfirm,
}: UserActionDialogProps) {
  const isDelete = action === "delete";
  const isBlock = action === "block";

  return (
    <ApplicationConfirmationDialog
      title={
        isDelete
          ? `Deactivate "${userName}"?`
          : isBlock
            ? `Block "${userName}"?`
            : `Unblock "${userName}"?`
      }
      description={
        isDelete
          ? `Deactivation is irreversible. Operational history and records associated with ${userEmail} will be preserved. The account will no longer be able to sign in.`
          : isBlock
            ? `Blocking will suspend "${userName}" (${userEmail}) and revoke all active sessions. The account will not be able to sign in.`
            : `Unblocking will restore "${userName}" (${userEmail}) to active status.`
      }
      confirmLabel={
        isDelete ? "Deactivate" : isBlock ? "Block" : "Unblock"
      }
      variant={variant}
      iconStatus={iconStatus}
      isDisabled={isDisabled}
      onConfirm={onConfirm}
    />
  );
}
