"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { updateShelter } from "@/app/actions/shelters";
import {
  updateShelterSchema,
  type UpdateShelterInput,
  type UpdateShelterValues,
} from "@/lib/validations/shelter.schema";

interface EditShelterFormProps {
  shelter: {
    id: string;
    name: string;
    address: string;
    capacity: number;
    currentOccupancy: number;
    latitude: number | null;
    longitude: number | null;
  };
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";
const labelClass = "mb-1.5 block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-500";

export function EditShelterForm({ shelter }: EditShelterFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdateShelterInput, unknown, UpdateShelterValues>({
    resolver: zodResolver(updateShelterSchema),
    defaultValues: {
      id: shelter.id,
      name: shelter.name,
      address: shelter.address,
      capacity: shelter.capacity,
      currentOccupancy: shelter.currentOccupancy,
      latitude: shelter.latitude ?? undefined,
      longitude: shelter.longitude ?? undefined,
    } as unknown as UpdateShelterInput,
  });

  async function onSubmit(values: UpdateShelterValues) {
    try {
      const result = await updateShelter(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    } catch {
      toast.error("Something went wrong while updating the shelter.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-border bg-surface p-5"
    >
      <div>
        <h2 className="text-lg font-semibold">Edit Shelter</h2>
        <p className="mt-1 text-sm text-muted">
          Update the shelter information for your organization.
        </p>
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>
          Shelter Name *
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          className={inputClass}
        />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="address" className={labelClass}>
          Address *
        </label>
        <input
          id="address"
          type="text"
          {...register("address")}
          className={inputClass}
        />
        {errors.address && (
          <p className={errorClass}>{errors.address.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="capacity" className={labelClass}>
            Capacity *
          </label>
          <Controller
            name="capacity"
            control={control}
            render={({ field }) => (
              <input
                id="capacity"
                type="number"
                value={String(field.value ?? "")}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
                className={inputClass}
              />
            )}
          />
          {errors.capacity && (
            <p className={errorClass}>{errors.capacity.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="currentOccupancy" className={labelClass}>
            Current Occupancy
          </label>
          <Controller
            name="currentOccupancy"
            control={control}
            render={({ field }) => (
              <input
                id="currentOccupancy"
                type="number"
                value={String(field.value ?? "")}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === ""
                      ? undefined
                      : Number(e.target.value),
                  )
                }
                className={inputClass}
              />
            )}
          />
          {errors.currentOccupancy && (
            <p className={errorClass}>
              {errors.currentOccupancy.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="latitude" className={labelClass}>
            Latitude
          </label>
          <Controller
            name="latitude"
            control={control}
            render={({ field }) => (
              <input
                id="latitude"
                type="number"
                step="any"
                value={String(field.value ?? "")}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
                className={inputClass}
              />
            )}
          />
          {errors.latitude && (
            <p className={errorClass}>{errors.latitude.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="longitude" className={labelClass}>
            Longitude
          </label>
          <Controller
            name="longitude"
            control={control}
            render={({ field }) => (
              <input
                id="longitude"
                type="number"
                step="any"
                value={String(field.value ?? "")}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === ""
                      ? undefined
                      : Number(e.target.value),
                  )
                }
                className={inputClass}
              />
            )}
          />
          {errors.longitude && (
            <p className={errorClass}>{errors.longitude.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
