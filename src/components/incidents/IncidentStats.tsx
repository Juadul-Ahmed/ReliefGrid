import {
  HiOutlineClipboardDocumentList,
  HiOutlineFire,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

interface IncidentStatsProps {
  total: number;
  active: number;
  critical: number;
  resolved: number;
}

const statConfig = [
  {
    key: "total",
    label: "Total Incidents",
    icon: HiOutlineClipboardDocumentList,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "active",
    label: "Active Incidents",
    icon: HiOutlineFire,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    key: "critical",
    label: "Critical Incidents",
    icon: HiOutlineExclamationTriangle,
    color: "text-danger",
    bg: "bg-danger/10",
  },
  {
    key: "resolved",
    label: "Resolved",
    icon: HiOutlineCheckCircle,
    color: "text-success",
    bg: "bg-success/10",
  },
] as const;

export function IncidentStats({
  total,
  active,
  critical,
  resolved,
}: IncidentStatsProps) {
  const values = { total, active, critical, resolved };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statConfig.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.key}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{stat.label}</p>

              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <Icon className={`size-5 ${stat.color}`} />
              </div>
            </div>

            <p className="mt-3 text-3xl font-bold">
              {values[stat.key]}
            </p>
          </div>
        );
      })}
    </div>
  );
}