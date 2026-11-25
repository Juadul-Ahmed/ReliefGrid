"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import { updateResource } from "@/app/actions/resources";
import {
  updateResourceSchema,
  RESOURCE_CATEGORIES,
  type UpdateResourceInput,
  type UpdateResourceValues,
} from "@/lib/validations/resource.schema";

interface EditResourceFormProps {
  resource: {
    id: string;
    name: string;
    category: string;
    unit: string;
    description: string | null;
    sku: string | null;
    isActive: boolean;
  };
}

const categoryLabels: Record<string, string> = {
  FOOD: "Food",
  DRINKING_WATER: "Drinking water",
  MEDICAL_SUPPLIES: "Medical supplies",
  SHELTER: "Shelter",
  RESCUE: "Rescue",
  TRANSPORTATION: "Transportation",
  OTHER: "Other",
};

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";
const labelClass = "mb-1.5 block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-500";

export function EditResourceForm({ resource }: EditResourceFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateResourceInput, unknown, UpdateResourceValues>({
    resolver: zodResolver(updateResourceSchema),
    defaultValues: {
      name: resource.name,
      category: resource.category,
      unit: resource.unit,
      description: resource.description ?? "",
      sku: resource.sku ?? "",
      isActive: resource.isActive,
    } as UpdateResourceInput,
  });

  async function onSubmit(values: UpdateResourceValues) {
    try {
      const result = await updateResource({
        resourceId: resource.id,
        ...values,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    } catch {
      toast.error("Something went wrong while updating the resource.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-border bg-surface p-5"
    >
      <div>
        <h2 className="text-lg font-semibold">Edit Resource</h2>
        <p className="mt-1 text-sm text-muted">
          Update the resource information for your organization.
        </p>
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>
          Name *
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          className={inputClass}
        />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className={labelClass}>
            Category *
          </label>
          <select
            id="category"
            {...register("category")}
            className={inputClass}
          >
            {RESOURCE_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {categoryLabels[value]}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className={errorClass}>{errors.category.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="unit" className={labelClass}>
            Unit *
          </label>
          <input
            id="unit"
            type="text"
            {...register("unit")}
            className={inputClass}
          />
          {errors.unit && (
            <p className={errorClass}>{errors.unit.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="sku" className={labelClass}>
          SKU
        </label>
        <input
          id="sku"
          type="text"
          {...register("sku")}
          className={inputClass}
        />
        {errors.sku && <p className={errorClass}>{errors.sku.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          {...register("description")}
          className={inputClass}
        />
        {errors.description && (
          <p className={errorClass}>{errors.description.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          {...register("isActive")}
          className="size-4 rounded border-border"
        />
        <label htmlFor="isActive" className="text-sm font-medium">
          Active
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}