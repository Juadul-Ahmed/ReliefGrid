"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { updateResourceStatus } from "@/app/actions/resources";

interface ResourceStatusToggleProps {
  resourceId: string;
  isActive: boolean;
}

export function ResourceStatusToggle({
  resourceId,
  isActive,
}: ResourceStatusToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    // Confirm before deactivating to avoid accidental removal from circulation.
    if (isActive && !window.confirm("Deactivate this resource?")) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateResourceStatus({
          resourceId,
          isActive: !isActive,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        router.refresh();
      } catch {
        toast.error("Something went wrong while updating the resource status.");
      }
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-sm font-semibold">Resource Status</h2>
        <p className="mt-0.5 text-xs text-muted">
          {isActive
            ? "This resource is active and available."
            : "This resource is inactive."}
        </p>
      </div>

      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
          isActive ? "bg-red-600" : "bg-green-600"
        }`}
      >
        {isPending ? "Updating..." : isActive ? "Deactivate" : "Activate"}
      </button>
    </section>
  );
}