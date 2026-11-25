
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { allocateEmergencyResources } from "@/app/actions/emergency-fulfillments";

interface OfferFulfillmentFormProps {
  requestId: string;
  itemId: string;
  unit: string;
  maxQuantity: number;
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50";

export function OfferFulfillmentForm({
  requestId,
  itemId,
  unit,
  maxQuantity,
}: OfferFulfillmentFormProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    const parsedQuantity = Number(quantity);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0 ||
      Math.abs(parsedQuantity * 1000 - Math.round(parsedQuantity * 1000)) >
        1e-8
    ) {
      toast.error(
        "Enter a valid quantity with no more than 3 decimal places.",
      );
      return;
    }

    if (parsedQuantity > maxQuantity) {
      toast.error(
        `You can allocate at most ${maxQuantity} ${unit}.`,
      );
      return;
    }

    startTransition(async () => {
      const result = await allocateEmergencyResources({
        requestId,
        itemId,
        quantity: parsedQuantity,
        notes,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      setQuantity("");
      setNotes("");

      router.refresh();
    });
  }

  return (
    <div className="mt-4 rounded-lg border border-dashed border-border p-4">
      <p className="text-sm font-semibold">
        Allocate resources
      </p>

      <p className="mt-1 text-xs text-muted">
        Up to {maxQuantity} {unit} remaining.
      </p>

      <div className="mt-3 space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium">
            Allocation quantity ({unit}) *
          </label>

          <input
            type="number"
            min="0.001"
            max={maxQuantity}
            step="0.001"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium">
            Notes
          </label>

          <textarea
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={isPending}
            placeholder="Optional: resource condition, pickup details, or constraints"
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || quantity === ""}
        className="mt-4 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Allocating Resources..." : "Allocate Resources"}
      </button>
    </div>
  );
}
