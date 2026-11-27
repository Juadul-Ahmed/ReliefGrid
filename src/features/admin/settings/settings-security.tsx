
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

const securitySchema = z.object({
  invitationExpiresInDays: z.number().int().min(1).max(365),
});

type SecurityInput = z.infer<typeof securitySchema>;

interface SettingsSecurityProps {
  initial: {
    invitationExpiresInDays: number;
  };
}

export default function SettingsSecurity({
  initial,
}: SettingsSecurityProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<SecurityInput>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      invitationExpiresInDays: initial.invitationExpiresInDays,
    },
  });

  async function onSubmit(values: SecurityInput) {
    setIsSubmitting(true);

    try {
      const result = await updatePlatformSettings({
        invitationExpiresInDays: values.invitationExpiresInDays,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Something went wrong while saving security settings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Security Settings
          </h2>
          <p className="mt-1 text-sm text-muted">
            Session and invitation policies.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 px-5 py-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="invitation-expires-in-days" className={labelClass}>
              Invitation expiry (days)
            </label>
            <input
              id="invitation-expires-in-days"
              type="number"
              min="1"
              max="365"
              {...register("invitationExpiresInDays")}
              className={
                inputClass +
                (errors.invitationExpiresInDays ? " border-red-500" : "")
              }
              placeholder="7"
            />
            {errors.invitationExpiresInDays && (
              <p className={errorClass}>
                {errors.invitationExpiresInDays.message}
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              Organization invitations expire after this many days.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting || formIsSubmitting}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting || formIsSubmitting ? "Saving..." : "Save Security Settings"}
          </button>
        </div>
      </form>

      <div className="mt-4 border-t border-border pt-4 px-5 py-2">
        <p className="text-sm text-muted">
          Changes to invitation expiry require a server restart to take effect.
        </p>
      </div>
    </section>
  );
}