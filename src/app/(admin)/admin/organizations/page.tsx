
import { listOrganizations } from "@/app/actions/admin-organizations";
import OrganizationsOverview from "@/features/admin/organizations/organizations-overview";

interface OrganizationsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function OrganizationsPage({
  searchParams,
}: OrganizationsPageProps) {
  const params = await searchParams;

  const data = await listOrganizations({
    search: params.search,
    status: params.status,
    page: params.page ?? "1",
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <OrganizationsOverview
        initial={
          data as unknown as {
            organizations: Array<{
              id: string;
              name: string;
              slug: string;
              status: string;
              createdAt: Date;
              owner: { name: string | null; email: string | null } | null;
              memberCount: number;
            }>;
            total: number;
            activeCount: number;
            blockedCount: number;
            memberTotal: number;
          }
        }
        search={params.search ?? ""}
        status={params.status ?? "ALL"}
      />
    </div>
  );
}
