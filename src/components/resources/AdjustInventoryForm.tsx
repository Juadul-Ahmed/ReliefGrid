"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import { adjustInventory } from "@/app/actions/inventory";
import {
  inventoryAdjustmentSchema,
  type InventoryAdjustmentInput,
  type InventoryAdjustmentValues,
} from "@/lib/validations/inventory-adjustment.schema";

interface AdjustInventoryFormProps {
  inventoryItemId: string;
  unit: string;
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";
const labelClass = "mb-1.5 block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-500";

export function AdjustInventoryForm({
  inventoryItemId,
  unit,
}: AdjustInventoryFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<
    InventoryAdjustmentInput,
    unknown,
    InventoryAdjustmentValues
  >({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      inventoryItemId,
      quantity: "",
      reason: "",
    } as InventoryAdjustmentInput,
  });

  async function onSubmit(values: InventoryAdjustmentValues) {
    try {
      const result = await adjustInventory(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    } catch {
      toast.error("Something went wrong while adjusting inventory.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-4 space-y-4 rounded-lg border border-border p-4"
    >
      <div>
        <label htmlFor="quantity" className={labelClass}>
          Adjustment ({unit}) *
        </label>
        <input
          id="quantity"
          type="number"
          step="0.001"
          inputMode="decimal"
          placeholder="e.g. 10 or -5"
          {...register("quantity")}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted">
          Use a positive value to add stock or a negative value to remove
          stock.
        </p>
        {errors.quantity && (
          <p className={errorClass}>{errors.quantity.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="reason" className={labelClass}>
          Reason *
        </label>
        <textarea
          id="reason"
          rows={2}
          maxLength={500}
          placeholder="Explain the reason for this adjustment"
          {...register("reason")}
          className={inputClass}
        />
        {errors.reason && (
          <p className={errorClass}>{errors.reason.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Adjusting..." : "Adjust Stock"}
        </button>
      </div>
    </form>
  );
}