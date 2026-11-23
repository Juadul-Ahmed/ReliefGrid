
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import {
  acceptOrganizationInvitation,
  rejectOrganizationInvitation,
} from "@/app/actions/accept-organization-invitation";

interface InvitationAcceptanceCardProps {
  invitationId: string;
  organizationName: string;
  invitedEmail: string;
  invitedRole: string;
  inviterName: string;
  expiresAt: string;
  isAuthenticated: boolean;
  currentUserEmail?: string;
  status: string;
  isExpired: boolean;
}

export function InvitationAcceptanceCard({
  invitationId,
  organizationName,
  invitedEmail,
  invitedRole,
  inviterName,
  expiresAt,
  isAuthenticated,
  currentUserEmail,
  status,
  isExpired,
}: InvitationAcceptanceCardProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Better Auth stores invitation status in lowercase.
  const isPending = status.toLowerCase() === "pending" && !isExpired;

  const emailMatches =
    currentUserEmail?.toLowerCase() === invitedEmail.toLowerCase();

  async function handleResponse(action: "accept" | "reject") {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result =
        action === "accept"
          ? await acceptOrganizationInvitation(invitationId)
          : await rejectOrganizationInvitation(invitationId);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl text-primary">
        <span aria-hidden="true">✉</span>
      </div>

      <p className="text-sm font-medium text-muted-foreground">
        Organization invitation
      </p>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        Join {organizationName}
      </h1>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {inviterName} invited you to join this organization on ReliefGrid.
      </p>

      <div className="mt-6 space-y-4 rounded-xl bg-muted/50 p-4">
        <div>
          <p className="text-xs text-muted-foreground">Invited email</p>
          <p className="mt-1 break-all text-sm font-medium text-foreground">
            {invitedEmail}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Organization role</p>
          <p className="mt-1 text-sm font-medium capitalize text-foreground">
            {invitedRole}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Invitation expires</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {new Date(expiresAt).toLocaleString()}
          </p>
        </div>
      </div>

      {!isPending ? (
        <div className="mt-6 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
          {isExpired
            ? "This invitation has expired."
            : "This invitation is no longer available."}
        </div>
      ) : !isAuthenticated ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Sign in with <strong>{invitedEmail}</strong> to respond to this
            invitation. Email verification is not required.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/login?next=${encodeURIComponent(
                  `/invitations/accept?id=${invitationId}`,
                )}`,
              )
            }
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Sign in to continue
          </button>
        </div>
      ) : !emailMatches ? (
        <div className="mt-6 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
          You are signed in as <strong>{currentUserEmail}</strong>. This
          invitation was sent to <strong>{invitedEmail}</strong>. Sign out and
          sign in with the invited email address.
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleResponse("accept")}
            className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Please wait..." : "Accept invitation"}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleResponse("reject")}
            className="rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </section>
  );
}
