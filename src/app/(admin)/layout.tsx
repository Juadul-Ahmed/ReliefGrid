
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Require authentication.
  if (!session) {
    redirect("/login");
  }

  // Only System Administrators can access this area.
  if (session.user.systemRole !== "SYSTEM_ADMIN") {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
