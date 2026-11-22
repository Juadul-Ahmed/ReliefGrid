
import type { IconType } from "react-icons";

export type IncidentSeverity =
  | "Critical"
  | "High"
  | "Medium"
  | "Low";

export type IncidentStatus =
  | "Responding"
  | "Investigating"
  | "Reported"
  | "Resolved";

export interface DashboardStat {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  description: string;
  icon: IconType;
  iconStyle: string;
}

export interface Incident {
  id: string;
  title: string;
  location: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  time: string;
}

export interface SeverityItem {
  label: IncidentSeverity;
  count: number;
  percentage: number;
  color: string;
}

export interface OperationalActivity {
  title: string;
  detail: string;
  time: string;
  icon: IconType;
  color: string;
}
