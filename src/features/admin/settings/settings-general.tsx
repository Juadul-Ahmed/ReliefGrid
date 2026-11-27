
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { z } from "zod";

import { updatePlatformSettings } from "@/app/actions/admin-platform-settings";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";
const labelClass = "mb-1.5 block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-500";

const generalSchema = z.object({
  platformName: z.string().trim().max(100).optional().nullable(),
  platformDescription: z.string().trim().max(500).optional().nullable(),
  supportContactEmail: z.string().email().optional().nullable(),
  defaultTimezone: z.string().trim().max(50).optional().nullable(),
  defaultLocale: z.string().trim().max(10).optional().nullable(),
});

type GeneralInput = z.infer<typeof generalSchema>;

interface SettingsGeneralProps {
  initial: {
    platformName: string | null;
    platformDescription: string | null;
    supportContactEmail: string | null;
    defaultTimezone: string | null;
    defaultLocale: string | null;
  };
}

export default function SettingsGeneral({
  initial,
}: SettingsGeneralProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<GeneralInput>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      platformName: initial.platformName ?? "",
      platformDescription: initial.platformDescription ?? "",
      supportContactEmail: initial.supportContactEmail ?? "",
      defaultTimezone: initial.defaultTimezone ?? "",
      defaultLocale: initial.defaultLocale ?? "",
    },
  });

  async function onSubmit(values: GeneralInput) {
    setIsSubmitting(true);

    try {
      const result = await updatePlatformSettings({
        platformName: values.platformName || undefined,
        platformDescription: values.platformDescription || undefined,
        supportContactEmail: values.supportContactEmail || undefined,
        defaultTimezone: values.defaultTimezone || undefined,
        defaultLocale: values.defaultLocale || undefined,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Something went wrong while saving general settings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            General Platform Settings
          </h2>
          <p className="mt-1 text-sm text-muted">
            Platform name, description, contact, and locale defaults.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 px-5 py-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="platform-name" className={labelClass}>
              Platform name *
            </label>
            <input
              id="platform-name"
              type="text"
              {...register("platformName")}
              className={
                inputClass +
                (errors.platformName ? " border-red-500" : "")
              }
              placeholder="ReliefGrid"
            />
            {errors.platformName && (
              <p className={errorClass}>{errors.platformName.message}</p>
            )}
            <p className="mt-1 text-xs text-muted">
              Display name shown in headers and page titles.
            </p>
          </div>

          <div>
            <label
              htmlFor="platform-description"
              className={labelClass}
            >
              Platform description
            </label>
            <textarea
              id="platform-description"
              {...register("platformDescription")}
              className={
                inputClass +
                " min-h-[80px]" +
                (errors.platformDescription ? " border-red-500" : "")
              }
              placeholder="Emergency response coordination platform"
            />
            {errors.platformDescription && (
              <p className={errorClass}>
                {errors.platformDescription.message}
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              Short description of the platform purpose.
            </p>
          </div>

          <div>
            <label
              htmlFor="support-contact-email"
              className={labelClass}
            >
              Support contact email
            </label>
            <input
              id="support-contact-email"
              type="email"
              {...register("supportContactEmail")}
              className={
                inputClass +
                (errors.supportContactEmail ? " border-red-500" : "")
              }
              placeholder="support@example.com"
            />
            {errors.supportContactEmail && (
              <p className={errorClass}>
                {errors.supportContactEmail.message}
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              Public support contact address.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="default-timezone" className={labelClass}>
              Default timezone
            </label>
            <input
              id="default-timezone"
              type="text"
              {...register("defaultTimezone")}
              className={
                inputClass +
                (errors.defaultTimezone ? " border-red-500" : "")
              }
              placeholder="UTC"
            />
            {errors.defaultTimezone && (
              <p className={errorClass}>
                {errors.defaultTimezone.message}
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              Default timezone for date displays (e.g., UTC, America/New_York).
            </p>
          </div>

          <div>
            <label htmlFor="default-locale" className={labelClass}>
              Default language/locale
            </label>
            <input
              id="default-locale"
              type="text"
              {...register("defaultLocale")}
              className={
                inputClass +
                (errors.defaultLocale ? " border-red-500" : "")
              }
              placeholder="en"
            />
            {errors.defaultLocale && (
              <p className={errorClass}>{errors.defaultLocale.message}</p>
            )}
            <p className="mt-1 text-xs text-muted">
              Default locale code (e.g., en, es, fr).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting || formIsSubmitting}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting || formIsSubmitting ? "Saving..." : "Save General"}
          </button>
        </div>
      </form>
    </section>
  );
}
