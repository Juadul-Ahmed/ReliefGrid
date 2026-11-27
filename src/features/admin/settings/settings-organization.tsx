
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { z } from "zod";

import { updatePlatformSettings } from "@/app/actions/admin-platform-settings";

const organizationSchema = z.object({
  allowUserToCreateOrganization: z.boolean(),
});

type OrganizationInput = z.infer<typeof organizationSchema>;

interface SettingsOrganizationProps {
  initial: {
    allowUserToCreateOrganization: boolean;
  };
}

export default function SettingsOrganization({
  initial,
}: SettingsOrganizationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting: formIsSubmitting },
  } = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      allowUserToCreateOrganization: initial.allowUserToCreateOrganization,
    },
  });

  async function onSubmit(values: OrganizationInput) {
    setIsSubmitting(true);

    try {
      const result = await updatePlatformSettings({
        allowUserToCreateOrganization: values.allowUserToCreateOrganization,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Something went wrong while saving organization settings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Organization Settings
          </h2>
          <p className="mt-1 text-sm text-muted">
            Organization creation and membership defaults.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 px-5 py-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              id="allow-user-create-organization"
              type="checkbox"
              {...register("allowUserToCreateOrganization")}
              className="rounded border-border bg-background text-primary focus:ring-primary"
            />
            <div>
              <label
                htmlFor="allow-user-create-organization"
                className="block text-sm font-medium text-foreground"
              >
                Allow users to create organizations
              </label>
              <p className="text-xs text-muted">
                When enabled, users can create organizations directly without
                going through the application approval process.
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
            {isSubmitting || formIsSubmitting ? "Saving..." : "Save Organization Settings"}
          </button>
        </div>
      </form>

      <div className="mt-4 border-t border-border pt-4 px-5 py-2">
        <p className="text-sm text-muted">
          Changes to organization creation policy require a server restart to
          take effect.
        </p>
      </div>
    </section>
  );
}
