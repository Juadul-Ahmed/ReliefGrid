"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import { updateInventoryThreshold } from "@/app/actions/inventory";
import {
  inventoryThresholdSchema,
  type InventoryThresholdInput,
  type InventoryThresholdValues,
} from "@/lib/validations/inventory-threshold.schema";

interface SetLowStockThresholdFormProps {
  inventoryItemId: string;
  currentThreshold: number | null;
  unit: string;
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";
const labelClass = "mb-1.5 block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-500";

export function SetLowStockThresholdForm({
  inventoryItemId,
  currentThreshold,
  unit,
}: SetLowStockThresholdFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InventoryThresholdInput, unknown, InventoryThresholdValues>({
    resolver: zodResolver(inventoryThresholdSchema),
    defaultValues: {
      inventoryItemId,
      lowStockThreshold:
        currentThreshold === null ? "" : String(currentThreshold),
    } as InventoryThresholdInput,
  });

  async function onSubmit(values: InventoryThresholdValues) {
    try {
      const result = await updateInventoryThreshold(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    } catch {
      toast.error("Something went wrong while updating the threshold.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-4 space-y-4 rounded-lg border border-border p-4"
    >
      <div>
        <label htmlFor="lowStockThreshold" className={labelClass}>
          Low-stock threshold ({unit})
        </label>
        <input
          id="lowStockThreshold"
          type="number"
          step="0.001"
          inputMode="decimal"
          placeholder="Leave empty to clear"
          {...register("lowStockThreshold")}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted">
          When on-hand stock falls at or below this value, the resource is
          flagged as low stock. Leave empty to disable the alert.
        </p>
        {errors.lowStockThreshold && (
          <p className={errorClass}>{errors.lowStockThreshold.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Threshold"}
        </button>
      </div>
    </form>
  );
}