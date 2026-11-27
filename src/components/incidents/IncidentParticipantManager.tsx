
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { inviteIncidentParticipant } from "@/app/actions/incident-participants";
import type { getIncidentParticipants } from "@/lib/incidents/queries";

type Participants = NonNullable<
  Awaited<ReturnType<typeof getIncidentParticipants>>
>;

type Participant = Participants[number];

interface AvailableOrganization {
  id: string;
  name: string;
}

interface IncidentParticipantManagerProps {
  incidentId: string;
  participants: Participants;
  availableOrganizations: AvailableOrganization[];
  canManage: boolean;
}

const PARTICIPANT_ROLES = [
  { value: "MEDICAL", label: "Medical" },
  { value: "LOGISTICS", label: "Logistics" },
  { value: "RESCUE", label: "Rescue" },
  { value: "SUPPORT", label: "Support" },
] as const;

function formatDate(date: Date | null) {
  if (!date) return "Not provided";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusStyle(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-500/10 text-green-600";

    case "INVITED":
      return "bg-blue-500/10 text-blue-600";

    case "REJECTED":
    case "WITHDRAWN":
      return "bg-red-500/10 text-red-600";

    case "EXPIRED":
      return "bg-orange-500/10 text-orange-600";

    case "SUSPENDED":
      return "bg-yellow-500/10 text-yellow-600";

    case "COMPLETED":
      return "bg-muted/10 text-muted";

    default:
      return "bg-muted/10 text-muted";
  }
}

export function IncidentParticipantManager({
  incidentId,
  participants,
  availableOrganizations,
  canManage,
}: IncidentParticipantManagerProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [organizationId, setOrganizationId] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const now = new Date();

  // An expired invitation can be sent again.
  // Active, pending, suspended, and completed records cannot.
  const selectableOrganizations = availableOrganizations.filter(
    (organization) => {
      const existing = participants.find(
        (participant) =>
          participant.organization.id === organization.id,
      );

      if (!existing) return true;

      if (
        ["REJECTED", "EXPIRED", "WITHDRAWN"].includes(
          existing.status,
        )
      ) {
        return true;
      }

      if (existing.status === "INVITED") {
        return (
          existing.expiresAt !== null &&
          existing.expiresAt <= now
        );
      }

      return false;
    },
  );

  function toggleRole(role: string) {
    setSelectedRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    );
  }

  function handleInvite() {
    if (!organizationId) {
      toast.error("Please select an organization.");
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error("Select at least one participant role.");
      return;
    }

    startTransition(async () => {
      const result = await inviteIncidentParticipant({
        incidentId,
        organizationId,
        roles: selectedRoles,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      setOrganizationId("");
      setSelectedRoles([]);

      router.refresh();
    });
  }

  return (
    <section className="space-y-6 rounded-xl border border-border bg-surface p-5">
      <div>
        <h2 className="text-lg font-semibold">
          Participating Organizations
        </h2>

        <p className="mt-1 text-sm text-muted">
          Organizations involved in responding to this incident.
        </p>
      </div>

      {/* Existing participants */}
      {participants.length === 0 ? (
        <p className="text-sm text-muted">
          No organizations have been invited to participate yet.
        </p>
      ) : (
        <div className="space-y-4">
          {participants.map((participant: Participant) => {
            const isExpiredInvitation =
              participant.status === "INVITED" &&
              participant.expiresAt !== null &&
              participant.expiresAt <= now;

            const displayStatus = isExpiredInvitation
              ? "EXPIRED"
              : participant.status;

            return (
              <div
                key={participant.id}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {participant.organization.name}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {participant.roles.map((item) => (
                        <span
                          key={item.role}
                          className="rounded-full bg-muted/10 px-2.5 py-1 text-xs font-medium"
                        >
                          {formatStatus(item.role)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(displayStatus)}`}
                  >
                    {formatStatus(displayStatus)}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted">Invited by</p>
                    <p className="mt-1 font-medium">
                      {participant.invitedBy?.name ?? "Unknown"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted">Responded by</p>
                    <p className="mt-1 font-medium">
                      {participant.respondedBy?.name ?? "Not responded"}
                    </p>
                  </div>

                  {participant.status === "INVITED" && (
                    <div>
                      <p className="text-muted">Invitation expires</p>
                      <p className="mt-1 font-medium">
                        {formatDate(participant.expiresAt)}
                      </p>
                    </div>
                  )}

                  {participant.joinedAt && (
                    <div>
                      <p className="text-muted">Joined at</p>
                      <p className="mt-1 font-medium">
                        {formatDate(participant.joinedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invitation form */}
      {canManage && (
        <div className="border-t border-border pt-5">
          <h3 className="font-semibold">
            Invite an Organization
          </h3>

          <p className="mt-1 text-sm text-muted">
            Invitations remain valid for seven days.
          </p>

          <div className="mt-4 space-y-5">
            <div>
              <label
                htmlFor="participant-organization"
                className="mb-2 block text-sm font-medium"
              >
                Organization
              </label>

              <select
                id="participant-organization"
                value={organizationId}
                onChange={(event) =>
                  setOrganizationId(event.target.value)
                }
                disabled={isPending || selectableOrganizations.length === 0}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  Select an organization
                </option>

                {selectableOrganizations.map((organization) => (
                  <option
                    key={organization.id}
                    value={organization.id}
                  >
                    {organization.name}
                  </option>
                ))}
              </select>

              {selectableOrganizations.length === 0 && (
                <p className="mt-2 text-xs text-muted">
                  No organizations are currently available for invitation.
                </p>
              )}
            </div>

            <div>
              <p className="mb-3 text-sm font-medium">
                Participant Roles
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {PARTICIPANT_ROLES.map((role) => (
                  <label
                    key={role.value}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.value)}
                      onChange={() => toggleRole(role.value)}
                      disabled={isPending}
                      className="size-4 accent-primary"
                    />

                    {role.label}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleInvite}
              disabled={
                isPending ||
                !organizationId ||
                selectedRoles.length === 0 ||
                selectableOrganizations.length === 0
              }
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Sending Invitation..." : "Send Invitation"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
