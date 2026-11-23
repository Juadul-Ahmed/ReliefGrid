
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiShield,
  FiLogOut,
  FiArrowUpRight,
} from "react-icons/fi";
import { toast } from "react-toastify";

import { signOut } from "@/lib/auth-client";

interface OnboardingHeaderProps {
  userName: string;
}

export default function OnboardingHeader({
  userName,
}: OnboardingHeaderProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      const result = await signOut();

      if (result.error) {
        toast.error("Unable to sign out. Please try again.");
        setIsSigningOut(false);
        return;
      }

      toast.success("Signed out successfully.");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Something went wrong while signing out.");
      setIsSigningOut(false);
    }
  }

  return (
    <header className="mx-auto mb-10 max-w-5xl">
      {/* Top navigation */}
      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#101D35] text-white shadow-lg shadow-slate-900/10">
            <FiShield size={22} />
          </div>

          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-[#101D35]">
              ReliefGrid
            </h2>

            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Response Network
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiLogOut size={16} />
          <span className="hidden sm:inline">
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </span>
        </button>
      </div>

      {/* Welcome section */}
      <div className="relative overflow-hidden rounded-3xl bg-[#101D35] px-6 py-10 shadow-xl shadow-[#101D35]/10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border-[35px] border-white/[0.04]" />
        <div className="pointer-events-none absolute -bottom-32 right-32 size-64 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            YOUR RELIEFGRID JOURNEY STARTS HERE
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Welcome aboard,
            <span className="mt-2 block text-emerald-400">
              {userName}.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            Your account is ready. Choose how you want to contribute
            to the emergency response network and help communities
            respond when it matters most.
          </p>

          <div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white">
            Make a difference with ReliefGrid
            <FiArrowUpRight className="text-emerald-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
