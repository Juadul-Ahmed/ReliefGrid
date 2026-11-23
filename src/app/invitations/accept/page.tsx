
import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { InvitationAcceptanceCard } from "@/components/organization/InvitationAcceptanceCard";

interface InvitationPageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

export default async function InvitationAcceptancePage({
  searchParams,
}: InvitationPageProps) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <InvitationPageMessage message="No invitation ID was provided." />
    );
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id },
  });

  if (!invitation) {
    return (
      <InvitationPageMessage message="This invitation could not be found. It may have been removed or the link may be incorrect." />
    );
  }

  const [organization, inviter, session] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: invitation.organizationId },
      select: {
        name: true,
      },
    }),

    prisma.user.findUnique({
      where: { id: invitation.inviterId },
      select: {
        name: true,
      },
    }),

    getCurrentSession(),
  ]);

  // Temporary debugging: inspect the authenticated user and invitation.
  console.log("INVITATION PAGE SESSION:", {
    isAuthenticated: Boolean(session),

    user: session
      ? {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          emailVerified: session.user.emailVerified,
          systemRole: session.user.systemRole,
        }
      : null,

    session: session
      ? {
          id: session.session.id,
          activeOrganizationId:
            session.session.activeOrganizationId,
          expiresAt: session.session.expiresAt,
        }
      : null,

    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    },

    emailMatches: session
      ? session.user.email.toLowerCase() ===
        invitation.email.toLowerCase()
      : false,

    isExpired: invitation.expiresAt <= new Date(),
  });

  if (!organization) {
    return (
      <InvitationPageMessage message="The organization associated with this invitation could not be found." />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            ReliefGrid
          </Link>

          <p className="mt-2 text-sm text-muted-foreground">
            Disaster response and resource coordination
          </p>
        </div>

        <InvitationAcceptanceCard
          invitationId={invitation.id}
          organizationName={organization.name}
          invitedEmail={invitation.email}
          invitedRole={invitation.role ?? "MEMBER"}
          inviterName={inviter?.name || "An organization administrator"}
          expiresAt={invitation.expiresAt.toISOString()}
          isAuthenticated={Boolean(session)}
          currentUserEmail={session?.user.email}
          status={invitation.status}
          isExpired={invitation.expiresAt <= new Date()}
        />
      </div>
    </main>
  );
}

function InvitationPageMessage({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">
          Invitation unavailable
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {message}
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
