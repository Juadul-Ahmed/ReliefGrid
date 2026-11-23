
import { FiShield } from "react-icons/fi";

interface OnboardingHeaderProps {
  userName: string;
}

export default function OnboardingHeader({
  userName,
}: OnboardingHeaderProps) {
  return (
    <div className="mb-10 text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#101D35] text-white">
        <FiShield size={27} />
      </div>

      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
        Welcome to ReliefGrid
      </p>

      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Welcome, {userName}
      </h1>

      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
        Your account is ready. Let's get you connected to the
        ReliefGrid emergency response network.
      </p>
    </div>
  );
}
