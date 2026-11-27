
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { listUsers } from "@/app/actions/admin-users";
import UsersOverview from "@/features/admin/users/users-overview";

interface UsersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    role?: string;
    page?: string;
  }>;
}

export default async function UsersPage({
  searchParams,
}: UsersPageProps) {
  const params = await searchParams;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const data = await listUsers({
    search: params.search,
    status: params.status,
    role: params.role,
    page: params.page ?? "1",
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <UsersOverview
        initial={
          data as unknown as {
            users: Array<{
              id: string;
              name: string;
              email: string;
              emailVerified: boolean;
              systemRole: string;
              status: string;
              createdAt: Date;
              organizationCount: number;
            }>;
            total: number;
            activeCount: number;
            blockedCount: number;
            systemAdminCount: number;
          }
        }
        search={params.search ?? ""}
        status={params.status ?? "ALL"}
        role={params.role ?? "ALL"}
        currentUserId={session?.user.id ?? ""}
      />
    </div>
  );
}
