
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { submitOrganizationApplication } from "@/app/actions/organization-application";
import { organizationApplicationSchema } from "@/lib/validations/organization-application.schema";
import type { OrganizationApplicationFormValues } from "@/lib/validations/organization-application.schema";

export default function OrganizationApplicationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<OrganizationApplicationFormValues>({
    defaultValues: {
      organizationName: "",
      requestedSlug: "",
      organizationType: "",
      description: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
    },
  });

  const onSubmit = async (values: OrganizationApplicationFormValues) => {
    setIsSubmitting(true);
    clearErrors();

    try {
      const validation = organizationApplicationSchema.safeParse(values);

      if (!validation.success) {
        validation.error.issues.forEach((issue) => {
          const field = issue.path[0];

          if (field) {
            setError(field as keyof OrganizationApplicationFormValues, {
              type: "validation",
              message: issue.message,
            });
          }
        });

        toast.error("Please check the form and correct the errors.");
        return;
      }

      const result = await submitOrganizationApplication(validation.data);

      if (!result.success) {
        if ("errors" in result && result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages?.[0]) {
              setError(field as keyof OrganizationApplicationFormValues, {
                type: "server",
                message: messages[0],
              });
            }
          });
        }

        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/onboarding");
    } catch (error) {
      console.error("Application form submission failed:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Consistent field styling for light and dark themes.
  const inputClass =
    "block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm !text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-800 dark:!text-white dark:placeholder:text-slate-400";

  const labelClass =
    "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300";

  const errorClass = "mt-1 text-sm text-red-500";

  const slugInputClass =
    "block min-w-0 flex-1 border-0 bg-white px-3 py-3 text-sm !text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-800 dark:!text-white dark:placeholder:text-slate-400";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Organization Information */}
      <div className="space-y-5">
        {/* Organization Name */}
        <div>
          <label className={labelClass} htmlFor="organizationName">
            Organization Name *
          </label>

          <input
            id="organizationName"
            type="text"
            {...register("organizationName")}
            placeholder="e.g. Bangladesh Red Crescent Society"
            className={inputClass}
          />

          {errors.organizationName && (
            <p className={errorClass}>
              {errors.organizationName.message}
            </p>
          )}
        </div>

        {/* Organization Slug */}
        <div>
          <label className={labelClass} htmlFor="requestedSlug">
            Organization URL Slug *
          </label>

          <div className="flex overflow-hidden rounded-xl border border-slate-300 dark:border-slate-600">
            <span className="flex shrink-0 items-center border-r border-slate-300 bg-slate-100 px-3 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
              reliefgrid.org/
            </span>

            <input
              id="requestedSlug"
              type="text"
              {...register("requestedSlug")}
              placeholder="your-organization"
              className={slugInputClass}
            />
          </div>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Lowercase letters, numbers, and hyphens only.
          </p>

          {errors.requestedSlug && (
            <p className={errorClass}>
              {errors.requestedSlug.message}
            </p>
          )}
        </div>

        {/* Organization Type */}
        <div>
          <label className={labelClass} htmlFor="organizationType">
            Organization Type *
          </label>

          <select
            id="organizationType"
            {...register("organizationType")}
            className={inputClass}
          >
            <option value="">Select organization type</option>
            <option value="NGO">NGO</option>
            <option value="Government">Government Agency</option>
            <option value="Emergency Services">Emergency Services</option>
            <option value="Healthcare">Healthcare Organization</option>
            <option value="Humanitarian">Humanitarian Organization</option>
            <option value="Volunteer Organization">Volunteer Organization</option>
            <option value="Private Organization">Private Organization</option>
            <option value="Other">Other</option>
          </select>

          {errors.organizationType && (
            <p className={errorClass}>
              {errors.organizationType.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className={labelClass} htmlFor="description">
            Organization Description
          </label>

          <textarea
            id="description"
            {...register("description")}
            rows={4}
            placeholder="Describe your organization, its mission, and the services it provides..."
            className={`${inputClass} resize-y`}
          />

          {errors.description && (
            <p className={errorClass}>
              {errors.description.message}
            </p>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
        <h3 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">
          Contact Information
        </h3>

        <div className="space-y-5">
          {/* Contact Email */}
          <div>
            <label className={labelClass} htmlFor="contactEmail">
              Contact Email *
            </label>

            <input
              id="contactEmail"
              type="email"
              {...register("contactEmail")}
              placeholder="organization@example.com"
              className={inputClass}
            />

            {errors.contactEmail && (
              <p className={errorClass}>
                {errors.contactEmail.message}
              </p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <label className={labelClass} htmlFor="contactPhone">
              Contact Phone
            </label>

            <input
              id="contactPhone"
              type="tel"
              {...register("contactPhone")}
              placeholder="+880 1XXX XXXXXX"
              className={inputClass}
            />

            {errors.contactPhone && (
              <p className={errorClass}>
                {errors.contactPhone.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className={labelClass} htmlFor="address">
              Organization Address
            </label>

            <textarea
              id="address"
              {...register("address")}
              rows={2}
              placeholder="Street, city, country"
              className={`${inputClass} resize-y`}
            />

            {errors.address && (
              <p className={errorClass}>
                {errors.address.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Application Notice */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
        <p className="text-sm text-emerald-800 dark:text-emerald-300">
          Your application will be reviewed by a ReliefGrid administrator.
          Your organization will become active after approval.
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Submitting Application..."
          : "Submit Organization Application"}
      </button>
    </form>
  );
}
