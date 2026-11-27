
"use client";

import {
  HiOutlineClipboardDocumentList,
  HiOutlineBuildingOffice2,
  HiOutlineMap,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineUsers,
} from "react-icons/hi2";

const capabilities = [
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
    icon: HiOutlineMap,
    title: "Operational Map",
    description:
      "Visualize incident locations, resources, and response coverage on a shared map.",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Resource Management",
    description:
      "Organize emergency requests, resources, shelters, teams, and allocations.",
  },
  {
    icon: HiOutlineTruck,
    title: "Resource Coordination",
    description:
      "Track resource movements, stock levels, and dispatch across organizations.",
  },
  {
    icon: HiOutlineUsers,
    title: "Team Response",
    description:
      "Assign coordinators, invite participant organizations, and manage participants.",
  },
];

export function LandingCapabilities() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-secondary/50">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Core Capabilities
          </span>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need for coordinated response
          </h2>

          <p className="mt-5 leading-7 text-muted max-w-xl mx-auto">
            ReliefGrid brings incident management, organization collaboration,
            resource coordination, and operational mapping into one platform.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {capabilities.map((capability) => {
            const Icon = capability.icon;

            return (
              <article
                key={capability.title}
                className="rounded-2xl border border-border bg-surface p-7 transition-shadow hover:shadow-lg"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <Icon className="size-6" />
                </div>

                <h3 className="text-lg font-semibold text-foreground">
                  {capability.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-muted">
                  {capability.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
