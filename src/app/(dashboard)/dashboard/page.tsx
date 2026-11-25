import {
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
  HiOutlineExclamationTriangle,
  HiOutlineTruck,
} from "react-icons/hi2";

import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { getInventoryOverview, getInventoryStats } from "@/lib/inventory/queries";
import { requireOrganization } from "@/lib/permissions/organization";

export default async function DashboardPage() {
  const { organizationId } = await requireOrganization();

  const [stats, overview] = await Promise.all([
    getInventoryStats(organizationId),
    getInventoryOverview(organizationId),
  ]);

  const dashboardStats = [
    {
      title: "Active Resources",
      value: String(stats.activeResources),
      change: "Now",
      trend: "up" as const,
      description: "Active resource records",
      icon: HiOutlineCube,
      iconStyle: "bg-info/10 text-info",
    },
    {
      title: "Inventory Items",
      value: String(stats.inventoryItems),
      change: "Now",
      trend: "up" as const,
      description: "Tracked stock items",
      icon: HiOutlineClipboardDocumentList,
      iconStyle: "bg-emergency/10 text-emergency",
    },
    {
      title: "Available Stock",
      value: stats.available,
      change: "Now",
      trend: "up" as const,
      description: "On hand minus reserved",
      icon: HiOutlineTruck,
      iconStyle: "bg-success/10 text-success",
    },
    {
      title: "Stock Alerts",
      value: String(overview.lowStock.length + overview.outOfStock.length),
      change: "Now",
      trend: "up" as const,
      description: `${overview.outOfStock.length} out of stock`,
      icon: HiOutlineExclamationTriangle,
      iconStyle: "bg-critical/10 text-critical",
    },
  ];

  return <DashboardOverview stats={dashboardStats} overview={overview} />;
}