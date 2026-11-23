
import Link from "next/link";
import {
  FiArrowRight,
  FiGlobe,
  FiShield,
  FiUsers,
} from "react-icons/fi";

const onboardingOptions = [
  {
    icon: FiUsers,
    title: "Join an organization",
    description:
      "Already invited by a response organization? You'll be able to accept your invitation and join its response team.",
    label: "Invitation workflow coming next",
    href: null,
  },
  {
    icon: FiShield,
    title: "Register an organization",
    description:
      "Represent a humanitarian group, emergency service, or response organization. Your application will be reviewed by a System Admin.",
    label: "Apply for registration",
    href: "/onboarding/organization",
  },
  {
    icon: FiGlobe,
    title: "Continue as an individual",
    description:
      "Explore public incidents and stay informed about emergency situations in your area.",
    label: "Individual dashboard coming next",
    href: null,
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
        (option) => option.href !== "/onboarding/organization",
      )
    : onboardingOptions;

  return (
    <>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">
          {hasActiveApplication
            ? "Explore other ways to get started"
            : "How would you like to get started?"}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {hasActiveApplication
            ? "Your organization application is being processed. You can explore other ReliefGrid options while you wait."
            : "Choose the path that best describes how you want to use ReliefGrid."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {visibleOptions.map((option) => {
          const Icon = option.icon;

          const cardContent = (
            <>
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-[#101D35]">
                <Icon size={21} />
              </div>

              <h3 className="text-base font-bold text-slate-900">
                {option.title}
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">
                {option.description}
              </p>

              <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-semibold text-emerald-700">
                <span>{option.label}</span>
                <FiArrowRight size={14} />
              </div>
            </>
          );

          return option.href ? (
            <Link
              key={option.title}
              href={option.href}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              {cardContent}
            </Link>
          ) : (
            <div
              key={option.title}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              {cardContent}
            </div>
          );
        })}
      </div>
    </>
  );
}
