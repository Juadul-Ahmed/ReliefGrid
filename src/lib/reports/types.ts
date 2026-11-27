
import type { DateRange, TrendDataPoint } from "@/lib/dashboard/queries";

export type ReportsDateRange = DateRange;

export interface DateRangeOption {
  value: ReportsDateRange;
  label: string;
  days: number;
}

export const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
];

export interface BreakdownItem {
  name: string;
  count: number;
}

export interface IncidentAnalytics {
  total: number;
  active: number;
  critical: number;
  resolved: number;
  byStatus: BreakdownItem[];
  bySeverity: BreakdownItem[];
  byCategory: BreakdownItem[];
  trends: TrendDataPoint[];
}

export interface RequestAnalytics {
  total: number;
  pending: number;
  fulfilled: number;
  fulfillmentRate: number;
  byStatus: BreakdownItem[];
  byPriority: BreakdownItem[];
  byCategory: BreakdownItem[];
  trends: TrendDataPoint[];
}

export interface ResourceAnalytics {
  total: number;
  active: number;
  inactive: number;
  byCategory: BreakdownItem[];
}

export interface InventoryAnalytics {
  onHand: string;
  reserved: string;
  available: string;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface StockMovementTypeSummary {
  type: string;
  quantity: string;
  count: number;
}

export interface StockMovementAnalytics {
  byType: StockMovementTypeSummary[];
  trends: TrendDataPoint[];
}

export interface ShelterCapacitySummary {
  total: number;
  active: number;
  inactive: number;
  closed: number;
  totalCapacity: number;
  totalOccupancy: number;
  availableCapacity: number;
  utilization: number;
}

export interface ShelterStatusBreakdownItem {
  name: string;
  count: number;
}

export interface ShelterAnalytics {
  capacity: ShelterCapacitySummary;
  statusBreakdown: ShelterStatusBreakdownItem[];
}

export interface KpiSummary {
  totalIncidents: number;
  activeIncidents: number;
  criticalIncidents: number;
  resolvedIncidents: number;
  totalRequests: number;
  pendingRequests: number;
  fulfilledRequests: number;
  fulfillmentRate: number;
  totalResources: number;
  activeResources: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalShelters: number;
  shelterUtilization: number;
}

export interface ReportsData {
  incidents: IncidentAnalytics;
  requests: RequestAnalytics;
  resources: ResourceAnalytics;
  inventory: InventoryAnalytics;
  stockMovements: StockMovementAnalytics;
  shelters: ShelterAnalytics;
}
