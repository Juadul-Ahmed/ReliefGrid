"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { updateAllocationStatus } from "@/app/actions/emergency-allocation-status";
import { dispatchAllocationItem } from "@/app/actions/m6-dispatch";
import { deliverAllocationItem } from "@/app/actions/m6-deliver";

interface AllocationItem {
  id: string;
  quantity: string;
  dispatchedQuantity: string;
  deliveredQuantity: string;
  status: string;
  inventoryItemId: string;
}

interface AllocationStatusActionsProps {
  allocationId: string;
  allocationStatus: string;
  items: AllocationItem[];
}

export function AllocationStatusActions({
  allocationId,
  allocationStatus,
  items,
}: AllocationStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dispatchQtys, setDispatchQtys] = useState<Record<string, string>>({});
  const [deliverQtys, setDeliverQtys] = useState<Record<string, string>>({});

  function handleUpdateAllocationStatus(nextStatus: "DISPATCHED" | "DELIVERED" | "CANCELLED") {
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

  function handleDispatch(item: AllocationItem) {
    const qty = dispatchQtys[item.id] ?? "";
    if (!qty || Number(qty) <= 0) {
      toast.error("Enter a quantity to dispatch");
      return;
    }
    const remaining = Number(item.quantity) - Number(item.dispatchedQuantity);
    if (Number(qty) > remaining) {
      toast.error(`Cannot dispatch more than remaining (${remaining})`);
      return;
    }

    startTransition(async () => {
      const result = await dispatchAllocationItem({
        resourceAllocationItemId: item.id,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function handleDeliver(item: AllocationItem) {
    const qty = deliverQtys[item.id] ?? "";
    const remaining = Number(item.quantity) - Number(item.deliveredQuantity);
    if (qty && (Number(qty) <= 0 || Number(qty) > remaining)) {
      toast.error(`Enter a quantity between 1 and ${remaining}`);
      return;
    }

    startTransition(async () => {
      const result = await deliverAllocationItem({
        resourceAllocationItemId: item.id,
        quantity: qty || null,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  if (allocationStatus === "DELIVERED" || allocationStatus === "CANCELLED") {
    return null;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const allocated = Number(item.quantity);
        const dispatched = Number(item.dispatchedQuantity);
        const delivered = Number(item.deliveredQuantity);
        const remainingToDispatch = allocated - dispatched;
        const remainingToDeliver = allocated - delivered;
        const canDispatch = allocationStatus === "ALLOCATED" && remainingToDispatch > 0;
        const canDeliver = allocationStatus === "DISPATCHED" && remainingToDeliver > 0;

        return (
          <div key={item.id} className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
            <div className="grid grid-cols-3 gap-2 text-xs text-muted">
              <div>
                <p>Allocated</p>
                <p className="font-medium text-foreground">{allocated}</p>
              </div>
              <div>
                <p>Dispatched</p>
                <p className="font-medium text-foreground">{dispatched}</p>
              </div>
              <div>
                <p>Delivered</p>
                <p className="font-medium text-foreground">{delivered}</p>
              </div>
            </div>

            {canDispatch && (
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max={remainingToDispatch}
                  value={dispatchQtys[item.id] ?? ""}
                  onChange={(e) => setDispatchQtys((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder={`Qty to dispatch (max ${remainingToDispatch})`}
                  className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleDispatch(item)}
                  disabled={isPending}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  {isPending ? "Dispatching..." : "Dispatch"}
                </button>
              </div>
            )}

            {canDeliver && (
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  max={remainingToDeliver}
                  value={deliverQtys[item.id] ?? ""}
                  onChange={(e) => setDeliverQtys((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder={`Qty to deliver (max ${remainingToDeliver}, empty = all)`}
                  className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleDeliver(item)}
                  disabled={isPending}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  {isPending ? "Delivering..." : "Deliver"}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {(allocationStatus === "ALLOCATED" || allocationStatus === "DISPATCHED") && (
        <button
          type="button"
          onClick={() => handleUpdateAllocationStatus("CANCELLED")}
          disabled={isPending}
          className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Cancelling..." : "Cancel allocation"}
        </button>
      )}
    </div>
  );
}