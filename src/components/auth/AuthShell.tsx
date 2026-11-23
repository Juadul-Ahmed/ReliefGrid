
import Link from "next/link";
import type { ReactNode } from "react";
import {
  FiActivity,
  FiArrowUpRight,
  FiHeart,
  FiShield,
  FiUsers,
} from "react-icons/fi";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
}

export function AuthShell({
  title,
  description,
  children,
  footerText,
  footerLinkText,
  footerHref,
}: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Branding panel */}
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#101D35] p-12 text-white lg:flex xl:p-16">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full border border-white/10" />

        <Link href="/" className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500">
            <FiActivity className="text-2xl text-white" />
          </div>
          <div>
            <span className="block text-xl font-bold tracking-tight">
              ReliefGrid
            </span>
            <span className="text-xs text-slate-400">
              Disaster Response Platform
            </span>
          </div>
        </Link>

        <div className="relative z-10 my-16 max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Coordinating response. Saving lives.
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Better coordination.
            <span className="mt-2 block text-emerald-400">
              Stronger response.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">
            Bring response organizations, field teams, and critical
            information together in one place. Help communities respond
            faster when every moment matters.
          </p>

          <div className="mt-12 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
                <FiShield size={21} />
              </div>
              <div>
                <p className="font-semibold">Trusted coordination</p>
                <p className="mt-1 text-sm text-slate-400">
                  Structured access for response organizations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
                <FiUsers size={21} />
              </div>
              <div>
                <p className="font-semibold">Connected response teams</p>
                <p className="mt-1 text-sm text-slate-400">
                  Keep teams and organizations aligned.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
                <FiHeart size={21} />
              </div>
              <div>
                <p className="font-semibold">Community focused</p>
                <p className="mt-1 text-sm text-slate-400">
                  Support faster, more informed response.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} ReliefGrid</span>
          <span className="flex items-center gap-1">
            Built for coordinated response
            <FiArrowUpRight />
          </span>
        </div>
      </section>

      {/* Authentication panel */}
      <section className="flex min-h-screen flex-col bg-[#F8FAFC] px-5 py-8 sm:px-10 lg:bg-white lg:px-12 xl:px-20">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#101D35] text-emerald-400">
              <FiActivity size={20} />
            </div>
            <span className="font-bold text-[#101D35]">ReliefGrid</span>
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="mb-9">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                ReliefGrid Account
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-[#101D35] sm:text-4xl">
                {title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                {description}
              </p>
            </div>

            {children}

            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="text-center text-sm text-slate-500">
                {footerText}{" "}
                <Link
                  href={footerHref}
                  className="font-semibold text-emerald-700 transition hover:text-emerald-800"
                >
                  {footerLinkText}
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
          <span>Secure access</span>
          <span>•</span>
          <span>Privacy focused</span>
          <span>•</span>
          <span>ReliefGrid Platform</span>
        </div>
      </section>
    </main>
  );
}
