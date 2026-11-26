import Link from "next/link";
import { HiOutlineHome } from "react-icons/hi2";

interface ShelterRow {
  id: string;
  name: string;
  address: string;
  capacity: number;
  currentOccupancy: number;
  status: string;
  displayStatus: string;
}

interface ShelterTableProps {
  shelters: ShelterRow[];
  hasFilters?: boolean;
  canManage?: boolean;
}

function occupancyPercent(capacity: number, currentOccupancy: number): number {
  if (capacity <= 0) return 0;
  return Math.round((currentOccupancy / capacity) * 100);
}

function statusBadge(displayStatus: string): {
  bg: string;
  text: string;
} {
  switch (displayStatus) {
    case "ACTIVE":
      return { bg: "bg-green-500/10", text: "text-green-600" };
    case "FULL":
      return { bg: "bg-amber-500/10", text: "text-amber-600" };
    case "INACTIVE":
      return { bg: "bg-muted/10", text: "text-muted" };
    case "CLOSED":
      return { bg: "bg-red-500/10", text: "text-red-600" };
    default:
      return { bg: "bg-muted/10", text: "text-muted" };
  }
}

export function ShelterTable({
  shelters,
  hasFilters = false,
  canManage = false,
}: ShelterTableProps) {
  if (shelters.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-16 text-center">
        <HiOutlineHome className="mx-auto size-12 text-muted" />

        <h3 className="mt-4 text-lg font-semibold">No shelters found</h3>

        <p className="mt-2 text-sm text-muted">
          {hasFilters
            ? "Try adjusting your search or filters."
            : "Your organization has not added any shelters yet."}
        </p>

        {!hasFilters && canManage && (
          <Link
            href="/shelters/create"
            className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Add your first shelter
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold">Shelters</h2>

        <p className="mt-1 text-sm text-muted">
          {shelters.length} shelter{shelters.length !== 1 ? "s" : ""} displayed
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-5 py-3 font-medium">Shelter</th>
              <th className="px-5 py-3 font-medium">Address</th>
              <th className="px-5 py-3 font-medium">Occupancy</th>
              <th className="px-5 py-3 font-medium">Capacity %</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {shelters.map((shelter) => {
              const { bg, text } = statusBadge(shelter.displayStatus);
              const percent = occupancyPercent(
                shelter.capacity,
                shelter.currentOccupancy,
              );

              return (
                <tr
                  key={shelter.id}
                  className="transition hover:bg-background"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/shelters/${shelter.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {shelter.name}
                    </Link>
                  </td>

                  <td className="px-5 py-4">
                    {shelter.address}
                  </td>

                  <td className="px-5 py-4">
                    {shelter.currentOccupancy} / {shelter.capacity}
                  </td>

                  <td className="px-5 py-4">{percent}%</td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${bg} ${text}`}
                    >
                      {shelter.displayStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
