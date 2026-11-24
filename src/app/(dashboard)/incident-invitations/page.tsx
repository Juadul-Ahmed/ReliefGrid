
import { requireOrganization } from "@/lib/permissions/organization";
import {
  hasOrganizationPermission,
} from "@/lib/permissions/organization-permissions";
import type { OrganizationRole } from "@/lib/permissions/organization-role";
import { getIncomingIncidentInvitations } from "@/lib/incidents/queries";

import { IncidentInvitationActions } from "@/components/incidents/IncidentInvitationActions";

function formatDate(date: Date | null) {
  if (!date) return "No expiration date";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function getSeverityStyle(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-500/10 text-red-600";

    case "HIGH":
      return "bg-orange-500/10 text-orange-600";

    case "MEDIUM":
      return "bg-yellow-500/10 text-yellow-600";

    case "LOW":
      return "bg-green-500/10 text-green-600";

    default:
      return "bg-muted/10 text-muted";
  }
}

export default async function IncidentInvitationsPage() {
  // Verify authentication and active organization membership.
  const context = await requireOrganization();

  // All active organization members can view incoming invitations.
  const invitations = await getIncomingIncidentInvitations(
    context.organizationId,
  );

  // Normalize the role before checking permissions.
  const role = context.membership.role.toUpperCase() as OrganizationRole;

  // Only OWNER and ADMIN can accept or reject invitations.
  const canRespond = hasOrganizationPermission(
    role,
    "RESPOND_TO_INCIDENT_INVITATIONS",
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Incident Invitations
        </h1>

        <p className="mt-1 text-sm text-muted">
          Review incident participation requests sent to{" "}
          <span className="font-medium text-foreground">
            {context.organization.name}
          </span>
          .
        </p>
      </div>

      {/* Invitation summary */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted">
          Pending invitations
        </p>

        <p className="mt-2 text-3xl font-bold">
          {invitations.length}
        </p>
      </div>

      {/* Invitations list */}
      {invitations.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-14 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted/10">
            <span className="text-2xl">📩</span>
          </div>

          <h2 className="mt-4 text-lg font-semibold">
            No pending invitations
          </h2>

          <p className="mt-1 text-sm text-muted">
            Your organization does not have any pending incident
            invitations at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => {
            const incident = invitation.incident;

            return (
              <article
                key={invitation.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-col gap-5">
                  {/* Incident information */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted">
                        {incident.incidentNumber}
                      </p>

                      <h2 className="mt-1 text-lg font-semibold">
                        {incident.title}
                      </h2>

                      <p className="mt-1 text-sm text-muted">
                        Lead organization:{" "}
                        <span className="font-medium text-foreground">
                          {incident.leadOrganization.name}
                        </span>
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${getSeverityStyle(
                        incident.severity,
                      )}`}
                    >
                      {formatLabel(incident.severity)}
                    </span>
                  </div>

                  {/* Incident description */}
                  {incident.description && (
                    <p className="text-sm leading-6 text-muted">
                      {incident.description}
                    </p>
                  )}

                  {/* Incident details */}
                  <div className="grid grid-cols-1 gap-4 rounded-lg bg-muted/5 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted">
                        Category
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatLabel(incident.category)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted">
                        Incident status
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatLabel(incident.status)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted">
                        Location
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {incident.locationName || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted">
                        Invited by
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {invitation.invitedBy?.name || "Unknown"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted">
                        Invitation received
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatDate(invitation.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted">
                        Expires
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {formatDate(invitation.expiresAt)}
                      </p>
                    </div>
                  </div>

                  {/* Requested participant roles */}
                  <div>
                    <p className="text-xs font-medium text-muted">
                      Requested participation roles
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {invitation.roles.map((item) => (
                        <span
                          key={item.role}
                          className="rounded-full border border-border px-3 py-1 text-xs font-medium"
                        >
                          {formatLabel(item.role)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Accept / Reject controls */}
                  <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted">
                      {canRespond
                        ? "Review this invitation before responding."
                        : "You have read-only access to this invitation."}
                    </p>

                    <IncidentInvitationActions
                      participantId={invitation.id}
                      canRespond={canRespond}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
