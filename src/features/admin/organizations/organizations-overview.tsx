
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import {
  blockOrganization,
  deleteOrganization,
  unblockOrganization,
} from "@/app/actions/admin-organizations";
import OrganizationFilters from "@/features/admin/organizations/organizations-filters";
import OrganizationStats from "@/features/admin/organizations/organizations-stats";
import OrganizationsTable from "@/features/admin/organizations/organizations-table";

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: Date;
  owner: { name: string | null; email: string | null } | null;
  memberCount: number;
}

interface OrganizationsOverviewProps {
  initial: {
    organizations: OrganizationRow[];
    total: number;
    activeCount: number;
    blockedCount: number;
    memberTotal: number;
  };
  search: string;
  status: string;
}

export default function OrganizationsOverview({
  initial,
  search,
  status,
}: OrganizationsOverviewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState({
    organizations: initial.organizations,
    total: initial.total,
    activeCount: initial.activeCount,
    blockedCount: initial.blockedCount,
    memberTotal: initial.memberTotal,
  });

  const handleFiltersChange = (params: { search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params.search !== undefined) {
      query.set("search", params.search);
    }
    if (params.status !== undefined) {
      query.set("status", params.status);
    }
    router.push(`/admin/organizations?${query.toString()}`);
  };

  const handleBlock = async (id: string) => {
    startTransition(async () => {
      const result = await blockOrganization({ organizationId: id });

      if (result.success) {
        toast.success(result.message);
        setData((prev) => ({
          ...prev,
          organizations: prev.organizations.map((org) =>
            org.id === id ? { ...org, status: "BLOCKED" } : org,
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
      const result = await unblockOrganization({ organizationId: id });

      if (result.success) {
        toast.success(result.message);
        setData((prev) => ({
          ...prev,
          organizations: prev.organizations.map((org) =>
            org.id === id ? { ...org, status: "ACTIVE" } : org,
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
      const result = await deleteOrganization({
        organizationId: id,
        reason: "Requested by system administrator.",
      });

      if (result.success) {
        toast.success(result.message);
        setData((prev) => ({
          ...prev,
          organizations: prev.organizations.filter((org) => org.id !== id),
          total: Math.max(0, prev.total - 1),
        }));
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <OrganizationFilters
        search={search}
        status={status}
        onChange={handleFiltersChange}
      />

      <OrganizationStats
        total={data.total}
        active={data.activeCount}
        blocked={data.blockedCount}
        members={data.memberTotal}
        loading={isPending}
      />

      <OrganizationsTable
        organizations={data.organizations}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onDelete={handleDelete}
      />
    </div>
  );
}
