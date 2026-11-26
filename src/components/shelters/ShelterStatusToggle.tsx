"use client";

import { useState } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { deleteShelter, updateShelterStatus } from "@/app/actions/shelters";

interface ShelterStatusToggleProps {
  shelterId: string;
  currentStatus: string;
  currentOccupancy: number;
  canManage: boolean;
}

const STATUS_OPTIONS: Array<{
  value: string;
  label: string;
  color: string;
}> = [
  { value: "ACTIVE", label: "Active", color: "bg-green-600" },
  { value: "INACTIVE", label: "Inactive", color: "bg-muted" },
  { value: "CLOSED", label: "Closed", color: "bg-red-600" },
];

export function ShelterStatusToggle({
  shelterId,
  currentStatus,
  currentOccupancy,
  canManage,
}: ShelterStatusToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  function setStatus(status: string) {
    if (status === currentStatus) {
      return;
    }

    const confirmMessage =
      status === "CLOSED"
        ? "Closing a shelter will prevent new occupants from being assigned. Are you sure?"
        : `Change shelter status to ${status.toLowerCase()}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateShelterStatus({
          id: shelterId,
          status,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        router.refresh();
      } catch {
        toast.error("Something went wrong while updating the shelter status.");
      }
    });
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Are you sure you want to delete "${shelterId}"? Shelters with current occupants cannot be deleted.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteShelter({ id: shelterId });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/shelters");
      router.refresh();
    } catch {
      toast.error("Something went wrong while deleting the shelter.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!canManage) {
    return null;
  }

  return (
    <section className="space-y-5">
      {/* Status Management */}
      <section className="rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Shelter Status</h2>
          <p className="mt-0.5 text-xs text-muted">
            {currentStatus === "ACTIVE"
              ? "This shelter is active and accepting occupants."
              : currentStatus === "INACTIVE"
                ? "This shelter is inactive."
                : "This shelter is closed."}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:flex-1 sm:justify-end">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              disabled={isPending || option.value === currentStatus}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${option.color} ${
                option.value === currentStatus ? "opacity-70" : ""
              }`}
            >
              {isPending ? "Updating..." : option.label}
            </button>
          ))}
        </div>
      </section>

      {/* Deletion */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Delete Shelter</h2>
            <p className="mt-0.5 text-xs text-muted">
              {currentOccupancy > 0
                ? "This shelter has current occupants and cannot be deleted."
                : "Permanently remove this shelter from your organization."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || currentOccupancy > 0}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 bg-red-600 ${
              currentOccupancy > 0 ? "opacity-50" : ""
            }`}
          >
            {isDeleting ? "Deleting..." : "Delete Shelter"}
          </button>
        </div>
      </section>
    </section>
  );
}
