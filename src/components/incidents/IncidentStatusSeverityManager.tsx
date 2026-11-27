
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { updateIncidentStatus } from "@/app/actions/incident-status";
import { updateIncidentSeverity } from "@/app/actions/incident-severity";

type IncidentStatus =
  | "OPEN"
  | "ASSESSING"
  | "ACTIVE"
  | "CONTAINED"
  | "RESOLVED"
  | "CLOSED"
  | "SUSPENDED"
  | "CANCELLED";

type IncidentSeverity =
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "CRITICAL";

interface IncidentStatusSeverityManagerProps {
  incidentId: string;
  currentStatus: IncidentStatus;
  currentSeverity: IncidentSeverity;
}

const allowedStatusTransitions: Record<
  IncidentStatus,
  IncidentStatus[]
> = {
  OPEN: ["ASSESSING", "CANCELLED"],
  ASSESSING: ["ACTIVE", "SUSPENDED", "CANCELLED"],
  ACTIVE: ["CONTAINED", "SUSPENDED", "CANCELLED"],
  CONTAINED: ["ACTIVE", "RESOLVED", "SUSPENDED"],
  RESOLVED: ["CLOSED", "ACTIVE"],
  SUSPENDED: ["ACTIVE", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};

const severityOptions: IncidentSeverity[] = [
  "LOW",
  "MODERATE",
  "HIGH",
  "CRITICAL",
];

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function IncidentStatusSeverityManager({
  incidentId,
  currentStatus,
  currentSeverity,
}: IncidentStatusSeverityManagerProps) {
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] =
    useState<IncidentStatus>(currentStatus);

  const [selectedSeverity, setSelectedSeverity] =
    useState<IncidentSeverity>(currentSeverity);

  const [isPending, startTransition] = useTransition();

  const availableStatuses =
    allowedStatusTransitions[currentStatus];

  const isTerminalStatus =
    currentStatus === "CLOSED" ||
    currentStatus === "CANCELLED";

  const hasStatusChanges = selectedStatus !== currentStatus;
  const hasSeverityChanges =
    selectedSeverity !== currentSeverity;

  function handleUpdateStatus() {
    if (!hasStatusChanges) return;

    startTransition(async () => {
      const result = await updateIncidentStatus({
        incidentId,
        status: selectedStatus,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function handleUpdateSeverity() {
    if (!hasSeverityChanges || isTerminalStatus) return;

    startTransition(async () => {
      const result = await updateIncidentSeverity({
        incidentId,
        severity: selectedSeverity,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div>
        <h2 className="text-lg font-semibold">
          Incident Status & Severity Management
        </h2>

        <p className="mt-1 text-sm text-muted">
          Manage the operational status and severity of this incident.
        </p>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        {/* Status Management */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">
              Update Status
            </h3>

            <p className="mt-1 text-xs text-muted">
              Current status: {formatLabel(currentStatus)}
            </p>
          </div>

          {availableStatuses.length > 0 ? (
            <>
              <select
                id="incident-status"
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(
                    event.target.value as IncidentStatus,
                  )
                }
                disabled={isPending}
                className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value={currentStatus}>
                  {formatLabel(currentStatus)} (Current)
                </option>

                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={isPending || !hasStatusChanges}
className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Updating..." : "Update Status"}
              </button>
            </>
          ) : (
            <p className="rounded-xl border border-border bg-background p-3 text-sm text-muted">
              This incident is in a terminal status. No further status
              changes are allowed.
            </p>
          )}
        </div>

        {/* Severity Management */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">
              Update Severity
            </h3>

            <p className="mt-1 text-xs text-muted">
              Current severity: {formatLabel(currentSeverity)}
            </p>
          </div>

          <select
            id="incident-severity"
            value={selectedSeverity}
            onChange={(event) =>
              setSelectedSeverity(
                event.target.value as IncidentSeverity,
              )
            }
            disabled={isPending || isTerminalStatus}
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {severityOptions.map((severity) => (
              <option key={severity} value={severity}>
                {formatLabel(severity)}
              </option>
            ))}
          </select>

          {isTerminalStatus ? (
            <p className="text-xs text-muted">
              Severity cannot be changed after an incident is closed
              or cancelled.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleUpdateSeverity}
              disabled={isPending || !hasSeverityChanges}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Updating..." : "Update Severity"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
