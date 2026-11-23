
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/session";

export async function requireSystemAdmin() {
  const session = await requireAuth();

  if (session.user.systemRole !== "SYSTEM_ADMIN") {
    redirect("/onboarding");
  }

  return session;
}
