
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import {
  HiOutlineBell,
  HiOutlineBuildingOffice2,
  HiOutlineClipboard,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlinePaperAirplane,
} from "react-icons/hi2";

import {
  getIncomingOrganizationInvitations,
  type InvitationNotification,
} from "@/app/actions/incoming-organization-invitations";

import {
  acceptOrganizationInvitation,
  rejectOrganizationInvitation,
} from "@/app/actions/accept-organization-invitation";

function getStatusDetails(status: InvitationNotification["status"]) {
  switch (status) {
    case "ACCEPTED":
      return {
        label: "Accepted",
        className: "bg-green-500/10 text-green-600",
        icon: HiOutlineCheckCircle,
      };

    case "REJECTED":
      return {
        label: "Rejected",
        className: "bg-red-500/10 text-red-600",
        icon: HiOutlineXMark,
      };

    case "EXPIRED":
      return {
        label: "Expired",
        className: "bg-amber-500/10 text-amber-600",
        icon: HiOutlineClock,
      };

    case "CANCELLED":
      return {
        label: "Cancelled",
        className: "bg-slate-500/10 text-slate-500",
        icon: HiOutlineXMark,
      };

    default:
      return {
        label: "Pending",
        className: "bg-blue-500/10 text-blue-600",
        icon: HiOutlineClock,
      };
  }
}

export function InvitationNotifications() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [hasViewedNotifications, setHasViewedNotifications] =
    useState(false);

  const [invitations, setInvitations] = useState<
    InvitationNotification[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load notifications when the component mounts.
  useEffect(() => {
    let isActive = true;

    getIncomingOrganizationInvitations()
      .then((result) => {
        if (!isActive) return;

        if (!result.success) {
          toast.error(result.message ?? "Unable to load notifications.");
          return;
        }

        setInvitations(result.invitations);
      })
      .catch(() => {
        if (isActive) {
          toast.error("Unable to load notifications.");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  // Refresh notifications manually.
  async function handleRefresh() {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const result = await getIncomingOrganizationInvitations();

      if (!result.success) {
        toast.error(result.message ?? "Unable to load notifications.");
        return;
      }

      setInvitations(result.invitations);
    } catch {
      toast.error("Unable to load notifications.");
    } finally {
      setIsLoading(false);
    }
  }

  // Open or close the notification dropdown.
  function handleToggleNotifications() {
    setIsOpen((current) => {
      const nextOpen = !current;

      if (nextOpen) {
        setHasViewedNotifications(true);
      }

      return nextOpen;
    });
  }

  // Accept or reject an incoming invitation.
  async function handleInvitation(
    invitationId: string,
    action: "accept" | "reject",
  ) {
    if (processingId) return;

    setProcessingId(invitationId);

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

      setInvitations((current) =>
        current.filter((invitation) => invitation.id !== invitationId),
      );

      if (result.redirectTo) {
        setIsOpen(false);
        router.push(result.redirectTo);
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setProcessingId(null);
    }
  }

  // Copy invitation link.
  async function copyInvitationLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invitation link copied.");
    } catch {
      toast.error("Could not copy the invitation link.");
    }
  }

  return (
    <div className="relative z-[70]">
      {/* Notification bell */}
      <button
        type="button"
        aria-label={`Notifications${
          invitations.length
            ? `, ${invitations.length} notifications`
            : ""
        }`}
        aria-expanded={isOpen}
        onClick={handleToggleNotifications}
        className="relative z-[70] flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
      >
        <HiOutlineBell className="size-5" />

        {/* Hide badge after notifications have been viewed */}
        {invitations.length > 0 && !hasViewedNotifications && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-emergency text-[10px] font-semibold text-white">
            {invitations.length > 9 ? "9+" : invitations.length}
          </span>
        )}
      </button>

      {/* Notification dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[65] cursor-default"
          />

          <div className="absolute right-0 top-12 z-[70] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
            {/* Dropdown header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Notifications
                </h2>

                <p className="text-xs text-muted">
                  {invitations.length} notification
                  {invitations.length === 1 ? "" : "s"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={isLoading}
                className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {/* Notification list */}
            <div className="max-h-[440px] overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-10 text-center text-sm text-muted">
                  Loading notifications...
                </div>
              ) : invitations.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <HiOutlineBell className="mx-auto size-8 text-muted" />

                  <p className="mt-3 text-sm font-medium text-foreground">
                    No notifications
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    Your organization invitation updates will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {invitations.map((invitation) => {
                    const isIncoming = invitation.type === "INCOMING";
                    const isPending = invitation.status === "PENDING";
                    const isProcessing =
                      processingId === invitation.id;

                    const statusDetails = getStatusDetails(
                      invitation.status,
                    );

                    const StatusIcon = statusDetails.icon;

                    return (
                      <article
                        key={`${invitation.type}-${invitation.id}`}
                        className="space-y-3 p-4"
                      >
                        <div className="flex items-start gap-3">
                          {/* Notification icon */}
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            {isIncoming ? (
                              <HiOutlineBuildingOffice2 className="size-5" />
                            ) : (
                              <HiOutlinePaperAirplane className="size-5" />
                            )}
                          </div>

                          {/* Notification details */}
                          <div className="min-w-0 flex-1">
                            <h3 className="break-words text-sm font-semibold text-foreground">
                              {isIncoming
                                ? "New organization invitation"
                                : invitation.status === "ACCEPTED"
                                  ? "Invitation accepted"
                                  : invitation.status === "REJECTED"
                                    ? "Invitation rejected"
                                    : invitation.status === "EXPIRED"
                                      ? "Invitation expired"
                                      : invitation.status === "CANCELLED"
                                        ? "Invitation cancelled"
                                        : "Invitation sent"}
                            </h3>

                            <p className="mt-1 break-words text-xs text-muted">
                              {isIncoming
                                ? `${invitation.actorName} invited you to join ${invitation.organizationName}.`
                                : `${invitation.actorName} (${invitation.email}) — ${invitation.organizationName}.`}
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              Role:{" "}
                              <span className="font-medium capitalize text-foreground">
                                {invitation.role.toLowerCase()}
                              </span>
                            </p>

                            {/* Status and creation date */}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${statusDetails.className}`}
                              >
                                <StatusIcon className="size-3" />
                                {statusDetails.label}
                              </span>

                              <span className="text-[10px] text-muted">
                                {new Date(
                                  invitation.createdAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Expiration date */}
                            {isPending && (
                              <p className="mt-2 text-xs text-muted">
                                Expires:{" "}
                                {new Date(
                                  invitation.expiresAt,
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Incoming pending invitation actions */}
                        {isIncoming && isPending && (
                          <>
                            {invitation.invitationUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  void copyInvitationLink(
                                    invitation.invitationUrl!,
                                  )
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-secondary"
                              >
                                <HiOutlineClipboard className="size-4" />
                                Copy invitation link
                              </button>
                            )}

                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={Boolean(processingId)}
                                onClick={() =>
                                  void handleInvitation(
                                    invitation.id,
                                    "accept",
                                  )
                                }
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <HiOutlineCheck className="size-4" />
                                {isProcessing ? "Please wait..." : "Accept"}
                              </button>

                              <button
                                type="button"
                                disabled={Boolean(processingId)}
                                onClick={() =>
                                  void handleInvitation(
                                    invitation.id,
                                    "reject",
                                  )
                                }
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <HiOutlineXMark className="size-4" />
                                Reject
                              </button>
                            </div>
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
