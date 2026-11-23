
import Link from "next/link";
import {
  FiArrowUpRight,
  FiGlobe,
  FiShield,
  FiUsers,
  FiArrowRight,
  FiCheckCircle,
} from "react-icons/fi";

const onboardingOptions = [
  {
    icon: FiUsers,
    number: "01",
    title: "Join an organization",
    description:
      "Already invited by a response organization? Accept your invitation and become part of its emergency response team.",
    label: "Invitation workflow coming next",
    available: false,
    theme: "bg-blue-50 text-blue-700",
    iconBackground: "bg-blue-50",
  },
  {
    icon: FiShield,
    number: "02",
    title: "Register an organization",
    description:
      "Represent a humanitarian group, emergency service, or response organization and request official access to ReliefGrid.",
    label: "Apply for registration",
    available: true,
    theme: "bg-emerald-50 text-emerald-700",
    iconBackground: "bg-emerald-50",
    href: "/onboarding/organization",
  },
  {
    icon: FiGlobe,
    number: "03",
    title: "Continue as an individual",
    description:
      "Explore public incidents, stay informed about emergency situations, and discover ways to support your community.",
    label: "Individual dashboard coming next",
    available: false,
    theme: "bg-violet-50 text-violet-700",
    iconBackground: "bg-violet-50",
  },
];

interface OnboardingOptionsProps {
  hasActiveApplication: boolean;
}

export default function OnboardingOptions({
  hasActiveApplication,
}: OnboardingOptionsProps) {
  const visibleOptions = hasActiveApplication
    ? onboardingOptions.filter(
        (option) => !("href" in option),
      )
    : onboardingOptions;

  return (
    <section>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
          <span className="h-px w-6 bg-emerald-500" />
          GET STARTED
        </div>

        <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#101D35]">
          {hasActiveApplication
            ? "Explore other ways to participate"
            : "How would you like to get started?"}
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {hasActiveApplication
            ? "Your organization application is being processed. Discover other ways to connect with the ReliefGrid network."
            : "Choose the path that best describes how you want to contribute to the emergency response network."}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleOptions.map((option) => {
          const Icon = option.icon;

          const cardContent = (
            <>
              <div className="flex items-start justify-between">
                <div
                  className={`flex size-12 items-center justify-center rounded-xl ${option.iconBackground}`}
                >
                  <Icon className={`size-6 ${option.theme.split(" ")[1]}`} />
                </div>

                <span className="font-mono text-xs font-bold text-slate-300">
                  {option.number}
                </span>
              </div>

              <h3 className="mt-6 text-lg font-bold tracking-tight text-[#101D35]">
                {option.title}
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">
                {option.description}
              </p>

              <div className="mt-6 border-t border-slate-100 pt-4">
                {option.available ? (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                      {option.label}
                      <FiArrowUpRight />
                    </span>

                    <FiArrowRight className="text-emerald-600 transition-transform group-hover:translate-x-1" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                      {option.label}
                    </span>

                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      Soon
                    </span>
                  </div>
                )}
              </div>
            </>
          );

          return option.available && "href" in option && option.href ? (
            <Link
              key={option.title}
              href={option.href}
              className="group flex min-h-72 flex-col rounded-2xl border border-emerald-200/70 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              {cardContent}
            </Link>
          ) : (
            <div
              key={option.title}
              className="flex min-h-72 flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
            >
              {cardContent}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white/70 p-4">
        <FiCheckCircle className="mt-0.5 size-5 shrink-0 text-emerald-600" />

        <p className="text-xs leading-6 text-slate-500">
          Your account is ready. You can continue exploring the
          available options while additional ReliefGrid features
          become available.
        </p>
      </div>
    </section>
  );
}
