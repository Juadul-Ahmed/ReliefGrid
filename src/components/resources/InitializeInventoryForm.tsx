"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import { initializeInventory } from "@/app/actions/inventory";
import {
  initializeInventorySchema,
  type InitializeInventoryInput,
  type InitializeInventoryValues,
} from "@/lib/validations/inventory-initialization.schema";

interface InitializeInventoryFormProps {
  resourceId: string;
  unit: string;
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";
const labelClass = "mb-1.5 block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-500";

export function InitializeInventoryForm({
  resourceId,
  unit,
}: InitializeInventoryFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<
    InitializeInventoryInput,
    unknown,
    InitializeInventoryValues
  >({
    resolver: zodResolver(initializeInventorySchema),
    defaultValues: {
      resourceId,
      onHand: "",
      reason: "",
    } as InitializeInventoryInput,
  });

  async function onSubmit(values: InitializeInventoryValues) {
    try {
      const result = await initializeInventory(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    } catch {
      toast.error("Something went wrong while initializing inventory.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-4 space-y-4 rounded-lg border border-border p-4"
    >
      <div>
        <label htmlFor="onHand" className={labelClass}>
          Initial on-hand quantity ({unit}) *
        </label>
        <input
          id="onHand"
          type="number"
          min="0"
          step="0.001"
          inputMode="decimal"
          placeholder="0.000"
          {...register("onHand")}
          className={inputClass}
        />
        {errors.onHand && (
          <p className={errorClass}>{errors.onHand.message}</p>
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
          placeholder="e.g. Opening stock count"
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
          {isSubmitting ? "Initializing..." : "Initialize Inventory"}
        </button>
      </div>
    </form>
  );
}