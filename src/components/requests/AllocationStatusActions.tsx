"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { updateAllocationStatus } from "@/app/actions/emergency-allocation-status";

interface AllocationStatusActionsProps {
  allocationId: string;
  status: string;
}

type NextStatus = "DISPATCHED" | "DELIVERED" | "CANCELLED";

export function AllocationStatusActions({
  allocationId,
  status,
}: AllocationStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function update(nextStatus: NextStatus) {
    startTransition(async () => {
      const result = await updateAllocationStatus({
        allocationId,
        status: nextStatus,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  // Terminal states have no further actions.
  if (status === "DELIVERED" || status === "CANCELLED") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "ALLOCATED" && (
        <button
          type="button"
          onClick={() => update("DISPATCHED")}
          disabled={isPending}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Updating..." : "Mark dispatched"}
        </button>
      )}

      {status === "DISPATCHED" && (
        <button
          type="button"
          onClick={() => update("DELIVERED")}
          disabled={isPending}
          className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Updating..." : "Confirm delivery"}
        </button>
      )}

      {(status === "ALLOCATED" || status === "DISPATCHED") && (
        <button
          type="button"
          onClick={() => update("CANCELLED")}
          disabled={isPending}
          className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Updating..." : "Cancel allocation"}
        </button>
      )}
    </div>
  );
}