
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { z } from "zod";

import { updateOrganization } from "@/app/actions/organization";

const updateOrganizationNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Organization name is required")
    .max(150, "Organization name must be 150 characters or fewer"),
});

type UpdateOrganizationNameInput = z.infer<
  typeof updateOrganizationNameSchema
>;

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";
const labelClass = "mb-1.5 block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-500";

const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Administrator",
  MEMBER: "Member",
};

interface OrganizationNameEditorProps {
  organization: {
    id: string;
    name: string;
  };
  membership: {
    role: string;
  };
}

export function OrganizationNameEditor({
  organization,
  membership,
}: OrganizationNameEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const role = membership.role.toUpperCase();
  const isOwner = role === "OWNER";
  const roleLabel = roleLabels[role] ?? role;

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<UpdateOrganizationNameInput>({
    resolver: zodResolver(updateOrganizationNameSchema),
    defaultValues: {
      name: organization.name,
    },
  });

  const currentName = useWatch({ control, name: "name" });

  async function onSubmit(values: UpdateOrganizationNameInput) {
    setIsSubmitting(true);

    try {
      const result = await updateOrganization(values);

      if (!result.success) {
        toast.error(result.message);
        setIsSubmitting(false);
        return;
      }

      toast.success(result.message);
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error(
        "Something went wrong while updating the organization name.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Organization Information
          </h2>
          <p className="mt-1 text-sm text-muted">
            Manage your organization name and details.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3 px-5 py-4">
        <div>
          <p className="text-xs text-muted">Organization name</p>

          {isEditing ? (
            <div className="space-y-2">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-3"
              >
                <div>
                  <label htmlFor="org-name" className={labelClass}>
                    Organization name *
                  </label>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <>
                        <input
                          id="org-name"
                          type="text"
                          {...field}
                          className={
                            inputClass +
                            (errors.name ? " border-red-500" : "")
                          }
                        />
                        {errors.name && (
                          <p className={errorClass}>
                            {errors.name.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      formIsSubmitting ||
                      currentName === organization.name
                    }
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting || formIsSubmitting
                      ? "Saving..."
                      : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isSubmitting || formIsSubmitting}
                    className="rounded-lg bg-surface-secondary px-6 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm font-medium text-foreground">
                {organization.name}
              </p>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/5"
                >
                  <span className="size-3.5">Edit</span>
                </button>
              )}
            </>
          )}
        </div>

        <div>
          <p className="text-xs text-muted">Organization role</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {roleLabel}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted">Organization ID</p>
          <p className="mt-1 break-all font-mono text-xs text-muted">
            {organization.id}
          </p>
        </div>
      </div>

      {!isOwner && (
        <div className="px-5 py-4 border-t border-border">
          <p className="text-sm text-muted">
            Only the organization owner can rename the organization.
          </p>
        </div>
      )}
    </section>
  );
}
