
import {
  HiOutlineClipboardDocumentList,
  HiOutlineBuildingOffice2,
  HiOutlineTruck,
} from "react-icons/hi2";

const features = [
  {
    icon: HiOutlineClipboardDocumentList,
    title: "Incident Management",
    description:
      "Report, review, verify, and coordinate incidents through a shared operational workflow.",
  },
  {
    icon: HiOutlineBuildingOffice2,
    title: "Organization Collaboration",
    description:
      "Bring approved response organizations together with controlled access and shared coordination.",
  },
  {
    icon: HiOutlineTruck,
    title: "Resource Coordination",
    description:
      "Organize emergency requests, resources, shelters, teams, and allocations in one platform.",
  },
];

export function LandingAbout() {
  return (
    <section id="about" className="scroll-mt-20 border-t border-border bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            About ReliefGrid
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            One platform for coordinated emergency response
          </h2>

          <p className="mt-5 leading-7 text-muted">
            ReliefGrid is designed to help response organizations
            coordinate information, people, and resources during
            emergencies.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-border bg-background p-7 transition-shadow hover:shadow-lg"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </div>

                <h3 className="mt-6 text-lg font-semibold text-foreground">
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
  );
}
