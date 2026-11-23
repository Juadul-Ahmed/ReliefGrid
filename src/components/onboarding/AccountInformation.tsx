
interface AccountInformationProps {
  email: string;
}

export default function AccountInformation({
  email,
}: AccountInformationProps) {
  return (
    <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Account created successfully
          </p>

          <p className="mt-1 text-sm text-slate-600">
            {email}
          </p>
        </div>

        <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Regular account
        </span>
      </div>
    </div>
  );
}
