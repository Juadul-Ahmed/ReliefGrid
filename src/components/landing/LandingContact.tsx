
import Link from "next/link";
import { HiOutlineArrowRight } from "react-icons/hi2";

export function LandingContact() {
  return (
    <section
      id="contact"
      className="scroll-mt-20 border-t border-border bg-background py-24"
    >
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <span className="text-sm font-semibold uppercase tracking-wider text-primary">
          Get Involved
        </span>

        <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Be part of a coordinated response
        </h2>

        <p className="mx-auto mt-5 max-w-2xl leading-7 text-muted">
          Are you part of an organization involved in emergency
          response? Apply to join ReliefGrid and coordinate with
          other response organizations.
        </p>

          <Link
            href="/onboarding"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Started
            <HiOutlineArrowRight className="size-5" />
          </Link>
      </div>
    </section>
  );
}
