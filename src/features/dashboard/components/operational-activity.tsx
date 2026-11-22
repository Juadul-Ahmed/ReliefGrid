
import { operationalActivities } from "../data/dashboard-data";

export function OperationalActivity() {
  return (
    <section className="rounded-xl border border-border bg-surface">
      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-semibold text-foreground">
          Recent Operational Activity
        </h3>

        <p className="mt-1 text-xs text-muted">
          Latest updates from response operations
        </p>
      </div>

      {/* Activity list */}
      <div className="divide-y divide-border">
        {operationalActivities.map((activity, index) => {
          const Icon = activity.icon;

          return (
            <div
              key={`${activity.title}-${index}`}
              className="flex items-center gap-4 px-5 py-4"
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${activity.color}`}
              >
                <Icon className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {activity.title}
                </p>

                <p className="mt-1 truncate text-xs text-muted">
                  {activity.detail}
                </p>
              </div>

              <span className="shrink-0 text-xs text-muted">
                {activity.time}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
