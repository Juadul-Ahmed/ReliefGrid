
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireAuth } from "@/lib/auth/session";
import { requireOrganization } from "@/lib/permissions/organization";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  // 1. Require authentication.
  const session = await requireAuth();

  // 2. Redirect System Admin before checking organization membership.
  if (session.user.systemRole === "SYSTEM_ADMIN") {
    redirect("/admin");
  }

  // 3. Verify active organization and membership.
  await requireOrganization();

  // 4. Render protected dashboard.
  return <DashboardShell>{children}</DashboardShell>;
}
