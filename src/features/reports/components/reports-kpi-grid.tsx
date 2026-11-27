
"use client";

import type { KpiSummary } from "@/lib/reports/types";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
  HiOutlineExclamationTriangle,
  HiOutlineFire,
  HiOutlineHome,
  HiOutlineTruck,
  HiOutlineUsers,
} from "react-icons/hi2";
import { ReportsStatCard } from "./reports-stat-card";

interface ReportsKpiGridProps {
  kpis: KpiSummary;
}

export function ReportsKpiGrid({ kpis }: ReportsKpiGridProps) {
  const cards = [
    {
      title: "Total Incidents",
      value: kpis.totalIncidents,
      icon: HiOutlineFire,
      iconStyle: "bg-critical/10 text-critical",
    },
    {
      title: "Active Incidents",
      value: kpis.activeIncidents,
      icon: HiOutlineExclamationTriangle,
      iconStyle: "bg-emergency/10 text-emergency",
    },
    {
      title: "Critical Incidents",
      value: kpis.criticalIncidents,
      icon: HiOutlineExclamationTriangle,
      iconStyle: "bg-critical/10 text-critical",
    },
    {
      title: "Total Requests",
      value: kpis.totalRequests,
      icon: HiOutlineClipboardDocumentList,
      iconStyle: "bg-info/10 text-info",
    },
    {
      title: "Pending Requests",
      value: kpis.pendingRequests,
      icon: HiOutlineClipboardDocumentList,
      iconStyle: "bg-emergency/10 text-emergency",
    },
    {
      title: "Fulfillment Rate",
      value: `${kpis.fulfillmentRate}%`,
      subtitle: `${kpis.fulfilledRequests} of ${kpis.totalRequests} fulfilled`,
      icon: HiOutlineTruck,
      iconStyle: "bg-success/10 text-success",
    },
    {
      title: "Active Resources",
      value: kpis.activeResources,
      icon: HiOutlineCube,
      iconStyle: "bg-info/10 text-info",
    },
    {
      title: "Low-Stock Alerts",
      value: kpis.lowStockCount,
      icon: HiOutlineExclamationTriangle,
      iconStyle: kpis.lowStockCount > 0 ? "bg-critical/10 text-critical" : "bg-success/10 text-success",
    },
    {
      title: "Total Shelters",
      value: kpis.totalShelters,
      icon: HiOutlineHome,
      iconStyle: "bg-info/10 text-info",
    },
    {
      title: "Shelter Occupancy",
      value: `${kpis.shelterUtilization}%`,
      subtitle: "Occupied vs total capacity",
      icon: HiOutlineUsers,
      iconStyle: "bg-success/10 text-success",
    },
  ];

  return (
    <section
      aria-label="Key performance indicators"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      {cards.map((card) => (
        <ReportsStatCard key={card.title} {...card} />
      ))}
    </section>
  );
}
