
import Link from "next/link";
import {
  HiOutlineArrowRight,
  HiOutlineMap,
  HiOutlineShieldCheck,
  HiOutlineUsers,
} from "react-icons/hi2";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />

      <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <HiOutlineShieldCheck className="size-4" />
            Coordinating response. Saving lives.
          </span>

          <h1 className="mt-7 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            When disaster strikes,
            <span className="block text-primary">
              coordination matters.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-muted sm:text-lg">
            ReliefGrid connects organizations, response teams, and
            communities through one coordinated disaster response
            platform.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
            >
              Join ReliefGrid
              <HiOutlineArrowRight className="size-5" />
            </Link>

            <Link
              href="/#about"
              className="rounded-xl border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-secondary"
            >
              Learn More
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 rounded-3xl border border-border bg-surface p-7 shadow-xl">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HiOutlineMap className="size-7" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-foreground">
              Unified Incident Coordination
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Keep incident information, updates, and response
              coordination connected.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg">
            <div className="flex size-11 items-center justify-center rounded-xl bg-success/10 text-success">
              <HiOutlineUsers className="size-6" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">
              Team Collaboration
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Connect response organizations and teams.
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emergency/10 text-emergency">
              <HiOutlineShieldCheck className="size-6" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">
              Resource Management
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Coordinate resources and emergency support.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
