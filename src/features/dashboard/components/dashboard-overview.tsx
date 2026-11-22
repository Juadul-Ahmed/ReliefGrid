
import { DashboardWelcome } from "./dashboard-welcome";
import { DashboardStats } from "./dashboard-stats";
import { RecentIncidents } from "./recent-incidents";
import { IncidentSeverity } from "./incident-severity";
import { OperationalActivity } from "./operational-activity";

export function DashboardOverview() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <DashboardWelcome />

      <DashboardStats />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RecentIncidents />
        <IncidentSeverity />
      </section>

      <OperationalActivity />
    </div>
  );
}
