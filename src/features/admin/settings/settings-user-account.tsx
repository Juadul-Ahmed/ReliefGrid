
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { z } from "zod";

import { updatePlatformSettings } from "@/app/actions/admin-platform-settings";

const userAccountSchema = z.object({
  allowUserRegistration: z.boolean(),
  requireEmailVerificationOnInvitation: z.boolean(),
});

type UserAccountInput = z.infer<typeof userAccountSchema>;

interface SettingsUserAccountProps {
  initial: {
    allowUserRegistration: boolean;
    requireEmailVerificationOnInvitation: boolean;
  };
}

export default function SettingsUserAccount({
  initial,
}: SettingsUserAccountProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting: formIsSubmitting },
  } = useForm<UserAccountInput>({
    resolver: zodResolver(userAccountSchema),
    defaultValues: {
      allowUserRegistration: initial.allowUserRegistration,
      requireEmailVerificationOnInvitation:
        initial.requireEmailVerificationOnInvitation,
    },
  });

  async function onSubmit(values: UserAccountInput) {
    setIsSubmitting(true);

    try {
      const result = await updatePlatformSettings({
        allowUserRegistration: values.allowUserRegistration,
        requireEmailVerificationOnInvitation:
          values.requireEmailVerificationOnInvitation,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Something went wrong while saving user account settings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            User &amp; Account Settings
          </h2>
          <p className="mt-1 text-sm text-muted">
            Registration and authentication policies.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 px-5 py-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              id="allow-user-registration"
              type="checkbox"
              {...register("allowUserRegistration")}
              className="rounded border-border bg-background text-primary focus:ring-primary"
            />
            <div>
              <label
                htmlFor="allow-user-registration"
                className="block text-sm font-medium text-foreground"
              >
                Allow new user registration
              </label>
              <p className="text-xs text-muted">
                When enabled, users can sign up for new accounts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="require-email-verification"
              type="checkbox"
              {...register("requireEmailVerificationOnInvitation")}
              className="rounded border-border bg-background text-primary focus:ring-primary"
            />
            <div>
              <label
                htmlFor="require-email-verification"
                className="block text-sm font-medium text-foreground"
              >
                Require email verification on invitation
              </label>
              <p className="text-xs text-muted">
                When enabled, invited users must verify their email before
                accepting invitations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting || formIsSubmitting}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting || formIsSubmitting ? "Saving..." : "Save User Settings"}
          </button>
        </div>
      </form>

      <div className="mt-4 border-t border-border pt-4 px-5 py-2">
        <p className="text-sm text-muted">
          Changes to user registration and email verification require a server
          restart to take effect, as they are read from platform settings at
          Better Auth initialization time.
        </p>
      </div>
    </section>
  );
}
