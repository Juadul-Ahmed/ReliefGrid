
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function AuthContinuePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.systemRole === "SYSTEM_ADMIN") {
    redirect("/admin");
  }

  if (session.session.activeOrganizationId) {
    redirect("/dashboard");
  }

  redirect("/onboarding");
}
