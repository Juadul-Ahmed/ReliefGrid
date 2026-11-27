
import Link from "next/link";

import type { EmergencyRequestStats } from "@/lib/requests/queries";

interface PriorityItem {
  priority: string;
  count: number;
}

interface EmergencyRequestOverviewProps {
  stats: EmergencyRequestStats;
  recentRequests: Array<{
    id: string;
    requestNumber: string;
    title: string;
    category: string;
    priority: string;
    status: string;
    requiredBy: Date | null;
    createdAt: Date;
  }>;
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "CRITICAL":
      return "bg-critical/10 text-critical";
    case "HIGH":
      return "bg-emergency/10 text-emergency";
    case "MEDIUM":
      return "bg-info/10 text-info";
    case "LOW":
      return "bg-success/10 text-success";
    default:
      return "bg-muted/10 text-muted";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "SUBMITTED":
      return "bg-info/10 text-info";
    case "UNDER_REVIEW":
      return "bg-emergency/10 text-emergency";
    case "VERIFIED":
      return "bg-success/10 text-success";
    case "REJECTED":
      return "bg-critical/10 text-critical";
    case "IN_PROGRESS":
      return "bg-info/10 text-info";
    case "PARTIALLY_FULFILLED":
      return "bg-info/10 text-info";
    case "FULFILLED":
      return "bg-success/10 text-success";
    case "COMPLETED":
      return "bg-surface-secondary text-muted";
    default:
      return "bg-muted/10 text-muted";
  }
}

function relativeTime(createdAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(createdAt).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;

  return new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function EmergencyRequestOverview({
  stats,
  recentRequests,
}: EmergencyRequestOverviewProps) {
  const pendingRequests = stats.submitted + stats.underReview;
  const fulfillmentRate =
    stats.total > 0 ? Math.round((stats.fulfilled / stats.total) * 100) : 0;

  const priorityCounts: PriorityItem[] = [
    { priority: "CRITICAL", count: 0 },
    { priority: "HIGH", count: 0 },
    { priority: "MEDIUM", count: 0 },
    { priority: "LOW", count: 0 },
  ];

  for (const req of recentRequests) {
    const item = priorityCounts.find((p) => p.priority === req.priority);
    if (item) {
      item.count += 1;
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              Emergency Requests
            </h3>
            <p className="mt-1 text-xs text-muted">
              Requests submitted and tracked by your organization
            </p>
          </div>
          <Link
            href="/requests"
            className="text-sm text-primary hover:underline"
          >
            View all requests
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-5">
        <div className="bg-surface-secondary p-3 rounded-lg">
          <p className="text-xs text-muted">Total Requests</p>
          <p className="text-lg font-bold text-foreground">
            {stats.total}
          </p>
        </div>
        <div className="bg-surface-secondary p-3 rounded-lg">
          <p className="text-xs text-muted">Pending</p>
          <p className="text-lg font-bold text-emergency">
            {pendingRequests}
          </p>
        </div>
        <div className="bg-surface-secondary p-3 rounded-lg">
          <p className="text-xs text-muted">Verified</p>
          <p className="text-lg font-bold text-success">
            {stats.verified}
          </p>
        </div>
        <div className="bg-surface-secondary p-3 rounded-lg">
          <p className="text-xs text-muted">Fulfilled</p>
          <p className="text-lg font-bold text-success">
            {stats.fulfilled}
          </p>
        </div>
      </div>

      {/* Priority distribution */}
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
            Request Priorities
          </h4>
          <p className="text-xs text-muted">
            {fulfillmentRate}% fulfillment rate
          </p>
        </div>
        <div className="space-y-2">
          {priorityCounts.map((item) => (
            <div key={item.priority} className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold ${getPriorityColor(item.priority)}`}
              >
                {item.priority.charAt(0) + item.priority.slice(1).toLowerCase()}
              </span>
              <div className="flex-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${getPriorityColor(item.priority)}`}
                  style={{
                    width:
                      recentRequests.length > 0
                        ? `${(item.count / recentRequests.length) * 100}%`
                        : "0%",
                  }}
                />
              </div>
              <span className="text-xs text-muted w-8">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent requests list */}
      <div className="border-t border-border px-5 py-4">
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
          Recent Requests
        </h4>

        {recentRequests.length === 0 ? (
          <p className="text-sm text-muted">
            No emergency requests found for your organization.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recentRequests.slice(0, 5).map((req) => (
              <li
                key={req.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/requests/${req.id}`}
                    className="truncate text-sm font-medium hover:text-primary"
                  >
                    {req.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {req.requestNumber} · {relativeTime(req.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getStatusColor(req.status)}`}
                >
                  {req.status
                    .split("_")
                    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
                    .join(" ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
