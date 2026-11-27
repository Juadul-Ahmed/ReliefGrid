
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import {
  blockUser,
  deleteUser,
  unblockUser,
} from "@/app/actions/admin-users";
import UserFilters from "@/features/admin/users/users-filters";
import UserStats from "@/features/admin/users/users-stats";
import UsersTable from "@/features/admin/users/users-table";
import UserDetails from "@/features/admin/users/user-details";

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

interface UsersOverviewProps {
  initial: {
    users: UserRow[];
    total: number;
    activeCount: number;
    blockedCount: number;
    systemAdminCount: number;
  };
  search: string;
  status: string;
  role: string;
  currentUserId: string;
}

export default function UsersOverview({
  initial,
  search,
  status,
  role,
  currentUserId,
}: UsersOverviewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState({
    users: initial.users,
    total: initial.total,
    activeCount: initial.activeCount,
    blockedCount: initial.blockedCount,
    systemAdminCount: initial.systemAdminCount,
  });
  const [selectedUser, setSelectedUser] = useState<
    | {
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
        memberships: Array<{
          id: string;
          organizationId: string;
          organizationName: string;
          organizationSlug: string;
          organizationStatus: string;
          role: string;
          status: string;
          createdAt: Date;
        }>;
      }
    | null
  >(null);

  const handleFiltersChange = (params: {
    search?: string;
    status?: string;
    role?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.search !== undefined) {
      query.set("search", params.search);
    }
    if (params.status !== undefined) {
      query.set("status", params.status);
    }
    if (params.role !== undefined) {
      query.set("role", params.role);
    }
    router.push(`/admin/users?${query.toString()}`);
  };

  const handleBlock = async (id: string) => {
    startTransition(async () => {
      const result = await blockUser({ userId: id });

      if (result.success) {
        toast.success(result.message);
        setData((prev) => ({
          ...prev,
          users: prev.users.map((user) =>
            user.id === id ? { ...user, status: "BLOCKED" } : user,
          ),
          blockedCount: prev.blockedCount + 1,
          activeCount: Math.max(0, prev.activeCount - 1),
        }));
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleUnblock = async (id: string) => {
    startTransition(async () => {
      const result = await unblockUser({ userId: id });

      if (result.success) {
        toast.success(result.message);
        setData((prev) => ({
          ...prev,
          users: prev.users.map((user) =>
            user.id === id ? { ...user, status: "ACTIVE" } : user,
          ),
          blockedCount: Math.max(0, prev.blockedCount - 1),
          activeCount: prev.activeCount + 1,
        }));
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteUser({
        userId: id,
        reason: "Requested by system administrator.",
      });

      if (result.success) {
        toast.success(result.message);
        setData((prev) => ({
          ...prev,
          users: prev.users.filter((user) => user.id !== id),
          total: Math.max(0, prev.total - 1),
        }));
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleView = async (id: string) => {
    const { getUserDetails } = await import("@/app/actions/admin-users");
    const { user } = await getUserDetails(id);

    if (user) {
      setSelectedUser(user);
    }
  };

  return (
    <div className="space-y-6">
      {selectedUser ? (
        <UserDetails user={selectedUser} onBack={() => setSelectedUser(null)} />
      ) : (
        <>
          <UserFilters
            search={search}
            status={status}
            role={role}
            onChange={handleFiltersChange}
          />

          <UserStats
            total={data.total}
            active={data.activeCount}
            blocked={data.blockedCount}
            systemAdmins={data.systemAdminCount}
            loading={isPending}
          />

          <UsersTable
            users={data.users}
            currentUserId={currentUserId}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
            onDelete={handleDelete}
            onView={handleView}
          />
        </>
      )}
    </div>
  );
}
