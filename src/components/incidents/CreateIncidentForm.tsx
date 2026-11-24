
"use client";

import { useState } from "react";
import {
  useForm,
  type FieldPath,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createIncident } from "@/app/actions/incidents";

import {
  createIncidentSchema,
  type CreateIncidentFormValues,
} from "@/lib/validations/incident.schema";

const categories = [
  { value: "FIRE", label: "Fire" },
  { value: "FLOOD", label: "Flood" },
  { value: "EARTHQUAKE", label: "Earthquake" },
  { value: "LANDSLIDE", label: "Landslide" },
  { value: "STORM", label: "Storm" },
  { value: "MEDICAL", label: "Medical Emergency" },
  { value: "ACCIDENT", label: "Accident" },
  { value: "MISSING_PERSON", label: "Missing Person" },
  { value: "OTHER", label: "Other" },
];

const severities = [
  { value: "LOW", label: "Low" },
  { value: "MODERATE", label: "Moderate" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

const labelClass = "mb-1.5 block text-sm font-medium";

const errorClass = "mt-1 text-xs text-red-500";

export function CreateIncidentForm() {
  const [serverMessage, setServerMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<
    import("zod").input<typeof createIncidentSchema>,
    unknown,
    CreateIncidentFormValues
  >({
    resolver: zodResolver(createIncidentSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "OTHER",
      severity: "MODERATE",
      locationName: "",
      address: "",
      latitude: undefined,
      longitude: undefined,
      occurredAt: "",
    },
  });

  const onSubmit: SubmitHandler<CreateIncidentFormValues> = async (data) => {
    setServerMessage("");
    setIsSuccess(false);

    try {
      const result = await createIncident(data);

      if (!result.success) {
        setServerMessage(result.message);

        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            const message = messages?.[0];

            if (message) {
              setError(field as FieldPath<CreateIncidentFormValues>, {
                type: "server",
                message,
              });
            }
          });
        }

        return;
      }

      setIsSuccess(true);
      setServerMessage(
        `${result.message} Incident number: ${result.incident.incidentNumber}`,
      );

      reset();
    } catch {
      setServerMessage(
        "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Server Response */}
      {serverMessage && (
        <div
          role={isSuccess ? "status" : "alert"}
          className={`rounded-lg border p-3 text-sm ${
            isSuccess
              ? "border-green-500/30 bg-green-500/10 text-green-600"
              : "border-red-500/30 bg-red-500/10 text-red-500"
          }`}
        >
          {serverMessage}
        </div>
      )}

      {/* Incident Information */}
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <h2 className="text-lg font-semibold">
            Incident Information
          </h2>
          <p className="mt-1 text-sm text-muted">
            Provide the basic information about the incident.
          </p>
        </div>

        <div>
          <label htmlFor="title" className={labelClass}>
            Incident Title *
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Major flooding in downtown area"
            {...register("title")}
            className={inputClass}
            aria-invalid={Boolean(errors.title)}
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
            rows={5}
            placeholder="Describe what happened, the affected area, and the current situation..."
            {...register("description")}
            className={inputClass}
            aria-invalid={Boolean(errors.description)}
          />
          {errors.description && (
            <p className={errorClass}>{errors.description.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className={labelClass}>
              Incident Category *
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
            <label htmlFor="severity" className={labelClass}>
              Severity *
            </label>
            <select
              id="severity"
              {...register("severity")}
              className={inputClass}
            >
              {severities.map((severity) => (
                <option key={severity.value} value={severity.value}>
                  {severity.label}
                </option>
              ))}
            </select>
            {errors.severity && (
              <p className={errorClass}>{errors.severity.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Location Details */}
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <h2 className="text-lg font-semibold">Location Details</h2>
          <p className="mt-1 text-sm text-muted">
            Specify where the incident occurred.
          </p>
        </div>

        <div>
          <label htmlFor="locationName" className={labelClass}>
            Location Name
          </label>
          <input
            id="locationName"
            type="text"
            placeholder="e.g. Downtown District"
            {...register("locationName")}
            className={inputClass}
          />
          {errors.locationName && (
            <p className={errorClass}>{errors.locationName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="address" className={labelClass}>
            Full Address
          </label>
          <textarea
            id="address"
            rows={2}
            placeholder="Enter the full incident address..."
            {...register("address")}
            className={inputClass}
          />
          {errors.address && (
            <p className={errorClass}>{errors.address.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="latitude" className={labelClass}>
              Latitude
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              placeholder="e.g. 23.8103"
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
              placeholder="e.g. 90.4125"
              {...register("longitude")}
              className={inputClass}
            />
            {errors.longitude && (
              <p className={errorClass}>{errors.longitude.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Occurrence Details */}
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <h2 className="text-lg font-semibold">Occurrence Details</h2>
          <p className="mt-1 text-sm text-muted">
            Provide the date and time when the incident occurred.
          </p>
        </div>

        <div>
          <label htmlFor="occurredAt" className={labelClass}>
            Occurrence Date & Time
          </label>
          <input
            id="occurredAt"
            type="datetime-local"
            {...register("occurredAt")}
            className={inputClass}
          />
          {errors.occurredAt && (
            <p className={errorClass}>{errors.occurredAt.message}</p>
          )}
        </div>
      </section>

      {/* Form Actions */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating Incident..." : "Create Incident"}
        </button>
      </div>
    </form>
  );
}
