
import Link from "next/link";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineBuildingOffice2,
  HiOutlineMap,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineUsers,
} from "react-icons/hi2";

const featureCards = [
  {
    icon: HiOutlineClipboardDocumentList,
    title: "Incident Management",
    description:
      "Report, review, verify, and coordinate incidents through a shared operational workflow trusted by response organizations.",
  },
  {
    icon: HiOutlineBuildingOffice2,
    title: "Organization Collaboration",
    description:
      "Bring approved response organizations together with controlled access, shared coordination, and clear role boundaries.",
  },
  {
    icon: HiOutlineMap,
    title: "Operational Map",
    description:
      "Visualize incident locations, resources, and response coverage on a shared map for faster situational awareness.",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Resource Management",
    description:
      "Organize emergency requests, resources, shelters, teams, and allocations in one coordinated platform.",
  },
  {
    icon: HiOutlineTruck,
    title: "Resource Coordination",
    description:
      "Track resource movements, stock levels, and dispatch across organizations during active incidents.",
  },
  {
    icon: HiOutlineUsers,
    title: "Team Response",
    description:
      "Assign coordinators, invite participant organizations, and manage incident participants through structured workflows.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-t border-border py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <HiOutlineShieldCheck className="size-4" />
              About ReliefGrid
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              One platform for coordinated emergency response
            </h1>

            <p className="mt-6 leading-8 text-muted sm:text-lg max-w-xl mx-auto">
              ReliefGrid is built to help response organizations coordinate
              information, people, and resources during emergencies — from the
              first report through resolution.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-border bg-surface p-7 transition-shadow hover:shadow-lg"
                >
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                    <Icon className="size-6" />
                  </div>

                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-muted">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-secondary/50">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                How ReliefGrid works
              </h2>
              <p className="mt-6 leading-8 text-muted">
                ReliefGrid provides a structured workflow for emergency
                response — from the moment an incident is reported to the
                final resolution.
              </p>
            </div>

            <div className="space-y-6">
<ProcessStep
  number={1}
  title="Report an incident"
                description={
                  "Any visitor can submit a public incident report. Reports enter a review queue where authorized administrators verify and act on them."
                }
              />
<ProcessStep
  number={2}
  title="Review and verify"
                description={
                  "System administrators review public reports, verify details, and escalate verified incidents to the appropriate organizations."
                }
              />
<ProcessStep
  number={3}
  title="Coordinate response"
                description={
                  "Organizations collaborate through shared incident workspaces, participant management, and resource allocation."
                }
              />
<ProcessStep
  number={4}
  title="Resolve and close"
                description={
                  "Track incident status through OPEN, ASSESSING, ACTIVE, CONTAINED, and RESOLVED states until the incident is closed."
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Our mission
            </h2>
            <p className="mt-6 leading-8 text-muted max-w-xl mx-auto">
              ReliefGrid exists to make emergency response coordination faster,
              more transparent, and more accountable. By connecting
              organizations through one shared platform, we help communities
              respond to disasters with clarity and confidence.
            </p>
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-6">
            <Link
              href="/report-incident"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Report an Incident
            </Link>

            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-secondary"
            >
              Join ReliefGrid
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProcessStep({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
        {number}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
      </div>
    </div>
  );
}
