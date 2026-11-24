
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { assignIncidentCoordinator } from "@/app/actions/incident-coordinator";

interface CoordinatorMember {
  id: string;
  name: string;
  email: string;
}

interface IncidentCoordinatorManagerProps {
  incidentId: string;
  currentCoordinatorId: string | null;
  members: CoordinatorMember[];
}

export function IncidentCoordinatorManager({
  incidentId,
  currentCoordinatorId,
  members,
}: IncidentCoordinatorManagerProps) {
  const router = useRouter();

  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState(
    currentCoordinatorId ?? "",
  );

  const [isPending, startTransition] = useTransition();

  const hasCoordinator = Boolean(currentCoordinatorId);

  const hasChanges =
    selectedCoordinatorId !== (currentCoordinatorId ?? "");

  function handleAssignCoordinator() {
    if (!selectedCoordinatorId || !hasChanges) {
      return;
    }

    startTransition(async () => {
      const result = await assignIncidentCoordinator({
        incidentId,
        coordinatorId: selectedCoordinatorId,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function handleRemoveCoordinator() {
    if (!currentCoordinatorId) {
      return;
    }

    startTransition(async () => {
      const result = await assignIncidentCoordinator({
        incidentId,
        coordinatorId: null,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setSelectedCoordinatorId("");
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div>
        <h2 className="text-lg font-semibold">
          Incident Coordinator
        </h2>

        <p className="mt-1 text-sm text-muted">
          Assign an active organization member to oversee this incident.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="incident-coordinator"
            className="mb-2 block text-sm font-medium"
          >
            Select Coordinator
          </label>

          <select
            id="incident-coordinator"
            value={selectedCoordinatorId}
            onChange={(event) =>
              setSelectedCoordinatorId(event.target.value)
            }
            disabled={isPending}
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Select an organization member</option>

            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
        </div>

        {members.length === 0 && (
          <p className="text-sm text-muted">
            No active organization members are available.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAssignCoordinator}
            disabled={
              isPending ||
              !selectedCoordinatorId ||
              !hasChanges
            }
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending
              ? "Updating..."
              : hasCoordinator
                ? "Update Coordinator"
                : "Assign Coordinator"}
          </button>

          {hasCoordinator && (
            <button
              type="button"
              onClick={handleRemoveCoordinator}
              disabled={isPending}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove Coordinator
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
