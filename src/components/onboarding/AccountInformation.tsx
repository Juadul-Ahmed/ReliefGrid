
import {
  FiCheckCircle,
  FiMail,
  FiUser,
} from "react-icons/fi";

interface AccountInformationProps {
  email: string;
}

export default function AccountInformation({
  email,
}: AccountInformationProps) {
  return (
    <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <FiUser size={22} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-[#101D35]">
                Your account
              </h2>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                <FiCheckCircle size={11} />
                Created
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <FiMail className="shrink-0" />
              <span className="break-all">{email}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-3 sm:min-w-36">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Account type
          </p>

          <p className="mt-1 text-sm font-semibold text-[#101D35]">
            Individual
          </p>
        </div>
      </div>
    </section>
  );
}
