
"use client";

import { useState } from "react";
import { toast } from "react-toastify";

import { submitPublicIncidentReport } from "@/app/actions/public-incident-report";

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

interface PublicIncidentReportFormValues {
  title: string;
  description: string;
  category: string;
  severity: string;
  locationName: string;
  address: string;
  latitude: string;
  longitude: string;
}

export function PublicIncidentReportForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PublicIncidentReportFormValues>({
    title: "",
    description: "",
    category: "OTHER",
    severity: "MODERATE",
    locationName: "",
    address: "",
    latitude: "",
    longitude: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PublicIncidentReportFormValues, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleChange = (key: keyof PublicIncidentReportFormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    const nextErrors = { ...errors };
    delete nextErrors[key];
    setErrors(nextErrors);

    if (serverError) {
      setServerError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);

    // Client-side validation.
    const nextErrors: Partial<Record<keyof PublicIncidentReportFormValues, string>> = {};

    if (!formData.title.trim() || formData.title.trim().length < 5) {
      nextErrors.title = "Incident title must contain at least 5 characters";
    }

    if (!formData.description.trim() || formData.description.trim().length < 20) {
      nextErrors.description = "Description must contain at least 20 characters";
    }

    if (!formData.category) {
      nextErrors.category = "Please select an incident category";
    }

    if (!formData.severity) {
      nextErrors.severity = "Please select a severity level";
    }

    // Latitude and longitude must be provided together if either is present.
    const lat = formData.latitude.trim();
    const lon = formData.longitude.trim();

    if ((lat && !lon) || (!lat && lon)) {
      nextErrors.latitude = "Latitude and longitude must be provided together";
      nextErrors.longitude = "Latitude and longitude must be provided together";
    }

    if (lat) {
      const latNum = Number(lat);
      const lonNum = Number(lon);

      if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
        nextErrors.latitude = "Latitude must be between -90 and 90";
      }

      if (!Number.isFinite(lonNum) || lonNum < -180 || lonNum > 180) {
        nextErrors.longitude = "Longitude must be between -180 and 180";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Please check the incident information.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitPublicIncidentReport({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        severity: formData.severity,
        locationName: formData.locationName.trim() || undefined,
        address: formData.address.trim() || undefined,
        latitude: lat || undefined,
        longitude: lon || undefined,
      });

      if (result.success) {
        toast.success(result.message);
        setFormData({
          title: "",
          description: "",
          category: "OTHER",
          severity: "MODERATE",
          locationName: "",
          address: "",
          latitude: "",
          longitude: "",
        });
        setErrors({});
      } else {
        setServerError(result.message);
        toast.error(result.message);

        if (result.errors) {
          setErrors(result.errors as Partial<Record<keyof PublicIncidentReportFormValues, string>>);
        }
      }
    } catch {
      setServerError(
        "Something went wrong while submitting the incident report. Please try again.",
      );
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Incident Information */}
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
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
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="e.g. Major flooding in downtown area"
            className={inputClass + (errors.title ? " border-red-500" : "")}
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title && <p className={errorClass}>{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description *
          </label>
          <textarea
            id="description"
            rows={5}
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Describe what happened, the affected area, and the current situation..."
            className={inputClass + (errors.description ? " border-red-500" : "")}
            aria-invalid={Boolean(errors.description)}
          />
          {errors.description && (
            <p className={errorClass}>{errors.description}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className={labelClass}>
              Incident Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className={inputClass + (errors.category ? " border-red-500" : "")}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className={errorClass}>{errors.category}</p>
            )}
          </div>

          <div>
            <label htmlFor="severity" className={labelClass}>
              Severity *
            </label>
            <select
              id="severity"
              value={formData.severity}
              onChange={(e) => handleChange("severity", e.target.value)}
              className={inputClass + (errors.severity ? " border-red-500" : "")}
            >
              {severities.map((severity) => (
                <option key={severity.value} value={severity.value}>
                  {severity.label}
                </option>
              ))}
            </select>
            {errors.severity && (
              <p className={errorClass}>{errors.severity}</p>
            )}
          </div>
        </div>
      </section>

      {/* Location Details */}
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Location Details
          </h2>
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
            value={formData.locationName}
            onChange={(e) => handleChange("locationName", e.target.value)}
            placeholder="e.g. Downtown District"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="address" className={labelClass}>
            Full Address
          </label>
          <textarea
            id="address"
            rows={2}
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Enter the full incident address..."
            className={inputClass}
          />
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
              value={formData.latitude}
              onChange={(e) => handleChange("latitude", e.target.value)}
              placeholder="e.g. 23.8103"
              className={inputClass + (errors.latitude ? " border-red-500" : "")}
            />
            {errors.latitude && (
              <p className={errorClass}>{errors.latitude}</p>
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
              value={formData.longitude}
              onChange={(e) => handleChange("longitude", e.target.value)}
              placeholder="e.g. 90.4125"
              className={inputClass + (errors.longitude ? " border-red-500" : "")}
            />
            {errors.longitude && (
              <p className={errorClass}>{errors.longitude}</p>
            )}
          </div>
        </div>
      </section>

      {serverError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500">
          {serverError}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Incident Report"}
        </button>
      </div>
    </form>
  );
}
