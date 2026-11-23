
import {
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineMagnifyingGlass,
  HiOutlineBuildingOffice2,
} from "react-icons/hi2";

interface AdminOverviewStatsProps {
  totalApplications: number;
  pendingApplications: number;
  underReviewApplications: number;
  approvedOrganizations: number;
}

const statistics = [
  {
    key: "totalApplications",
    label: "Total Applications",
    icon: HiOutlineClipboardDocumentList,
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    key: "pendingApplications",
    label: "Pending Applications",
    icon: HiOutlineClock,
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    key: "underReviewApplications",
    label: "Under Review",
    icon: HiOutlineMagnifyingGlass,
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    key: "approvedOrganizations",
    label: "Approved Organizations",
    icon: HiOutlineBuildingOffice2,
    color: "bg-emerald-500/10 text-emerald-600",
  },
] as const;

export default function AdminOverviewStats({
  totalApplications,
  pendingApplications,
  underReviewApplications,
  approvedOrganizations,
}: AdminOverviewStatsProps) {
  const values = {
    totalApplications,
    pendingApplications,
    underReviewApplications,
    approvedOrganizations,
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statistics.map((statistic) => {
        const Icon = statistic.icon;

        return (
          <div
            key={statistic.key}
            className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted">
                {statistic.label}
              </p>

              <div
                className={`flex size-10 items-center justify-center rounded-xl ${statistic.color}`}
              >
                <Icon className="size-5" />
              </div>
            </div>

            <p className="mt-5 text-3xl font-bold tracking-tight text-foreground">
              {values[statistic.key].toLocaleString()}
            </p>

            <p className="mt-1 text-xs text-muted">
              Platform-wide overview
            </p>
          </div>
        );
      })}
    </div>
  );
}
