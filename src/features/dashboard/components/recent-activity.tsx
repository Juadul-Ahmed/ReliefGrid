
import type { AuditActivityItem } from "@/lib/dashboard/queries";

function formatAction(action: string): string {
  return action
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function formatEntityType(entityType: string): string {
  return entityType
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
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

interface RecentActivityProps {
  activity: AuditActivityItem[];
}

export function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <section className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-semibold text-foreground">
          Recent Activity
        </h3>
        <p className="mt-1 text-xs text-muted">
          Latest operational events for your organization
        </p>
      </div>

      {/* Activity list */}
      <div className="divide-y divide-border">
        {activity.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted">
              No recent activity recorded.
            </p>
          </div>
        ) : (
          <ul>
            {activity.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
                  <span className="text-xs font-semibold text-muted">
                    {item.action.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {formatAction(item.action)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatEntityType(item.entityType)} ·
                    {item.actorName ?? "Unknown actor"}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-muted">
                  {relativeTime(item.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
