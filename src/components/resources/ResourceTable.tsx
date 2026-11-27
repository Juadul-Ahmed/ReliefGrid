import Link from "next/link";
import { HiOutlineCube } from "react-icons/hi2";

interface ResourceRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  sku: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface ResourceTableProps {
  resources: ResourceRow[];
  hasFilters?: boolean;
  canManage?: boolean;
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

export function ResourceTable({
  resources,
  hasFilters = false,
  canManage = false,
}: ResourceTableProps) {
  if (resources.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-16 text-center">
        <HiOutlineCube className="mx-auto size-12 text-muted" />

        <h3 className="mt-4 text-lg font-semibold">No resources found</h3>

        <p className="mt-2 text-sm text-muted">
          {hasFilters
            ? "Try adjusting your search or filters."
            : "Your organization has not added any resources yet."}
        </p>

        {!hasFilters && canManage && (
          <Link
            href="/resources/create"
            className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Add your first resource
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold">Resources</h2>

        <p className="mt-1 text-sm text-muted">
          {resources.length} resource{resources.length !== 1 ? "s" : ""} displayed
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-5 py-3 font-medium">Resource</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Unit</th>
              <th className="px-5 py-3 font-medium">SKU</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {resources.map((resource) => (
              <tr
                key={resource.id}
                className="transition hover:bg-background"
              >
                <td className="px-5 py-4">
                  <Link
                    href={`/resources/${resource.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {resource.name}
                  </Link>
                </td>

                <td className="px-5 py-4">{label(resource.category)}</td>

                <td className="px-5 py-4">{resource.unit}</td>

                <td className="px-5 py-4">{resource.sku ?? "—"}</td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      resource.isActive
                        ? "bg-green-500/10 text-green-600"
                        : "bg-muted/10 text-muted"
                    }`}
                  >
                    {resource.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}