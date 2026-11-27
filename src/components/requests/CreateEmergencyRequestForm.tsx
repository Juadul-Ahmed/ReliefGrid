
"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";

import { createEmergencyRequest } from "@/app/actions/emergency-requests";
import {
  createEmergencyRequestSchema,
  type CreateEmergencyRequestInput,
  type CreateEmergencyRequestValues,
} from "@/lib/validations/emergency-request.schema";

interface IncidentOption {
  id: string;
  incidentNumber: string;
  title: string;
}

interface CreateEmergencyRequestFormProps {
  incidents: IncidentOption[];
}

const priorities = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
] as const;

const categories = [
  { value: "FOOD", label: "Food" },
  { value: "DRINKING_WATER", label: "Drinking water" },
  { value: "MEDICAL_SUPPLIES", label: "Medical supplies" },
  { value: "SHELTER", label: "Shelter" },
  { value: "RESCUE", label: "Rescue" },
  { value: "TRANSPORTATION", label: "Transportation" },
  { value: "OTHER", label: "Other" },
] as const;

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

const labelClass = "mb-1.5 block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-500";
const sectionClass = "space-y-4 rounded-xl border border-border bg-surface p-5";

const emptyItem = {
  name: "",
  description: "",
  quantity: 1,
  unit: "",
};

export function CreateEmergencyRequestForm({
  incidents,
}: CreateEmergencyRequestFormProps) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<
    CreateEmergencyRequestInput,
    unknown,
    CreateEmergencyRequestValues
  >({
    resolver: zodResolver(createEmergencyRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "OTHER",
      priority: "MEDIUM",
      incidentId: "",
      locationName: "",
      address: "",
      latitude: "",
      longitude: "",
      requiredBy: "",
      items: [{ ...emptyItem }],
    } as CreateEmergencyRequestInput,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  async function onSubmit(values: CreateEmergencyRequestValues) {
    try {
      const result = await createEmergencyRequest({
        ...values,
        // datetime-local has no timezone.
        // Convert browser-local time into an ISO timestamp.
        requiredBy: values.requiredBy
          ? new Date(values.requiredBy).toISOString()
          : undefined,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(`Request ${result.requestNumber} created.`);
      router.push("/requests");
      router.refresh();
    } catch {
      toast.error("Something went wrong while creating the request.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Request details */}
      <section className={sectionClass}>
        <div>
          <h2 className="text-lg font-semibold">Request Details</h2>
          <p className="mt-1 text-sm text-muted">
            Describe what is needed and classify the emergency request.
          </p>
        </div>

        <div>
          <label htmlFor="title" className={labelClass}>
            Title *
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Drinking water for flood shelter"
            {...register("title")}
            className={inputClass}
          />
          {errors.title && (
            <p className={errorClass}>{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description *
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Explain the situation, who is affected, and delivery constraints..."
            {...register("description")}
            className={inputClass}
          />
          {errors.description && (
            <p className={errorClass}>{errors.description.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className={labelClass}>
              Request category *
            </label>
            <select
              id="category"
              {...register("category")}
              className={inputClass}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className={errorClass}>{errors.category.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="priority" className={labelClass}>
              Priority *
            </label>
            <select
              id="priority"
              {...register("priority")}
              className={inputClass}
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
            {errors.priority && (
              <p className={errorClass}>{errors.priority.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="incidentId" className={labelClass}>
              Linked incident
            </label>
            <select
              id="incidentId"
              {...register("incidentId")}
              className={inputClass}
            >
              <option value="">Standalone request (no incident)</option>
              {incidents.map((incident) => (
                <option key={incident.id} value={incident.id}>
                  {incident.incidentNumber} — {incident.title}
                </option>
              ))}
            </select>
            {errors.incidentId && (
              <p className={errorClass}>{errors.incidentId.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="requiredBy" className={labelClass}>
              Required by
            </label>
            <input
              id="requiredBy"
              type="datetime-local"
              {...register("requiredBy")}
              className={inputClass}
            />
            {errors.requiredBy && (
              <p className={errorClass}>{errors.requiredBy.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Requested items */}
      <section className={sectionClass}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Requested Items</h2>
            <p className="mt-1 text-sm text-muted">
              Add the resources and quantities required. Multiple
              organizations can contribute to the same item.
            </p>
          </div>

          <button
            type="button"
            onClick={() => append({ ...emptyItem })}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-background"
          >
            <HiOutlinePlus className="size-4" />
            Add item
          </button>
        </div>

        {typeof errors.items?.message === "string" && (
          <p className={errorClass}>{errors.items.message}</p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => {
            const itemErrors = errors.items?.[index];

            return (
              <div
                key={field.id}
                className="rounded-lg border border-border p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    Item {index + 1}
                  </p>

                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                    >
                      <HiOutlineTrash className="size-4" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor={`item-name-${index}`}
                      className={labelClass}
                    >
                      Item name *
                    </label>
                    <input
                      id={`item-name-${index}`}
                      type="text"
                      placeholder="e.g. Bottled water 1.5L"
                      {...register(`items.${index}.name`)}
                      className={inputClass}
                    />
                    {itemErrors?.name && (
                      <p className={errorClass}>
                        {itemErrors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`item-quantity-${index}`}
                      className={labelClass}
                    >
                      Quantity *
                    </label>
                    <input
                      id={`item-quantity-${index}`}
                      type="number"
                      min="0.001"
                      max="1000000"
                      step="0.001"
                      {...register(`items.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                      className={inputClass}
                    />
                    {itemErrors?.quantity && (
                      <p className={errorClass}>
                        {itemErrors.quantity.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`item-unit-${index}`}
                      className={labelClass}
                    >
                      Unit *
                    </label>
                    <input
                      id={`item-unit-${index}`}
                      type="text"
                      placeholder="boxes, liters, pieces..."
                      {...register(`items.${index}.unit`)}
                      className={inputClass}
                    />
                    {itemErrors?.unit && (
                      <p className={errorClass}>
                        {itemErrors.unit.message}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor={`item-description-${index}`}
                      className={labelClass}
                    >
                      Item description
                    </label>
                    <textarea
                      id={`item-description-${index}`}
                      rows={2}
                      placeholder="Optional specifications or requirements"
                      {...register(`items.${index}.description`)}
                      className={inputClass}
                    />
                    {itemErrors?.description && (
                      <p className={errorClass}>
                        {itemErrors.description.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Delivery location */}
      <section className={sectionClass}>
        <div>
          <h2 className="text-lg font-semibold">Delivery Location</h2>
          <p className="mt-1 text-sm text-muted">
            Specify where the requested resources should be delivered.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="locationName" className={labelClass}>
              Location name
            </label>
            <input
              id="locationName"
              type="text"
              placeholder="e.g. Central Relief Shelter"
              {...register("locationName")}
              className={inputClass}
            />
            {errors.locationName && (
              <p className={errorClass}>{errors.locationName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="address" className={labelClass}>
              Address
            </label>
            <input
              id="address"
              type="text"
              placeholder="Street, district, city..."
              {...register("address")}
              className={inputClass}
            />
            {errors.address && (
              <p className={errorClass}>{errors.address.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="latitude" className={labelClass}>
              Latitude
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              {...register("latitude")}
              className={inputClass}
            />
            {errors.latitude && (
              <p className={errorClass}>{errors.latitude.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="longitude" className={labelClass}>
              Longitude
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              {...register("longitude")}
              className={inputClass}
            />
            {errors.longitude && (
              <p className={errorClass}>{errors.longitude.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating Request..." : "Create Request"}
        </button>
      </div>
    </form>
  );
}
