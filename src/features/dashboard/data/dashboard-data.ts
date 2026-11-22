
import {
  HiOutlineExclamationTriangle,
  HiOutlineClipboardDocumentList,
  HiOutlineCube,
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

import type {
  DashboardStat,
  Incident,
  SeverityItem,
  OperationalActivity,
} from "../types/dashboard.types";

export const dashboardStats: DashboardStat[] = [
  {
    title: "Active Incidents",
    value: "24",
    change: "+12%",
    trend: "up",
    description: "Compared to last week",
    icon: HiOutlineExclamationTriangle,
    iconStyle: "bg-critical/10 text-critical",
  },
  {
    title: "Pending Requests",
    value: "18",
    change: "-8%",
    trend: "down",
    description: "Compared to last week",
    icon: HiOutlineClipboardDocumentList,
    iconStyle: "bg-emergency/10 text-emergency",
  },
  {
    title: "Available Resources",
    value: "156",
    change: "+5%",
    trend: "up",
    description: "Compared to last week",
    icon: HiOutlineCube,
    iconStyle: "bg-info/10 text-info",
  },
  {
    title: "Active Volunteers",
    value: "86",
    change: "+18%",
    trend: "up",
    description: "Compared to last week",
    icon: HiOutlineUsers,
    iconStyle: "bg-success/10 text-success",
  },
];

export const recentIncidents: Incident[] = [
  {
    id: "INC-001",
    title: "Urban Flooding",
    location: "Central District",
    severity: "Critical",
    status: "Responding",
    time: "10 minutes ago",
  },
  {
    id: "INC-002",
    title: "Building Fire",
    location: "Northern District",
    severity: "High",
    status: "Investigating",
    time: "25 minutes ago",
  },
  {
    id: "INC-003",
    title: "Road Blockage",
    location: "Eastern District",
    severity: "Medium",
    status: "Reported",
    time: "42 minutes ago",
  },
  {
    id: "INC-004",
    title: "Water Shortage",
    location: "Southern District",
    severity: "Low",
    status: "Resolved",
    time: "1 hour ago",
  },
];

export const incidentSeverity: SeverityItem[] = [
  {
    label: "Critical",
    count: 4,
    percentage: 17,
    color: "bg-critical",
  },
  {
    label: "High",
    count: 8,
    percentage: 33,
    color: "bg-emergency",
  },
  {
    label: "Medium",
    count: 7,
    percentage: 29,
    color: "bg-info",
  },
  {
    label: "Low",
    count: 5,
    percentage: 21,
    color: "bg-success",
  },
];

export const operationalActivities: OperationalActivity[] = [
  {
    title: "New incident reported",
    detail: "Urban flooding in Central District",
    time: "10 minutes ago",
    icon: HiOutlineExclamationTriangle,
    color: "text-critical bg-critical/10",
  },
  {
    title: "Resource allocation completed",
    detail: "12 emergency supply kits dispatched",
    time: "35 minutes ago",
    icon: HiOutlineTruck,
    color: "text-info bg-info/10",
  },
  {
    title: "Volunteer team registered",
    detail: "Emergency Response Team B",
    time: "1 hour ago",
    icon: HiOutlineUsers,
    color: "text-success bg-success/10",
  },
  {
    title: "Emergency request resolved",
    detail: "Water supply request #REQ-024",
    time: "2 hours ago",
    icon: HiOutlineCheckCircle,
    color: "text-success bg-success/10",
  },
];
