
"use client";

import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";

import { createOrganizationInvitation } from "@/app/actions/organization-invitations";

export function OrganizationInvitationForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setInvitationUrl("");

    try {
      const result = await createOrganizationInvitation({
        email,
        role,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setInvitationUrl(result.invitationUrl);
      setEmail("");

      toast.success(result.message);
    } catch {
      toast.error("Something went wrong while creating the invitation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyLink() {
    if (!invitationUrl) return;

    try {
      await navigator.clipboard.writeText(invitationUrl);
      toast.success("Invitation link copied to clipboard.");
    } catch {
      toast.error("Unable to copy the invitation link.");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">
          Invite a member
        </h2>
        <p className="mt-1 text-sm text-muted">
          Invite someone to join your organization. Invitations expire after
          7 days.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="invitation-email"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Email address
          </label>

          <input
            id="invitation-email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="member@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label
            htmlFor="invitation-role"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Organization role
          </label>

          <select
            id="invitation-role"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as "ADMIN" | "MEMBER")
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Administrator</option>
          </select>

          <p className="mt-2 text-xs text-muted">
            Administrators can help manage the organization. Members have
            regular organization access.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !email.trim()}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating invitation..." : "Create invitation"}
        </button>
      </form>

      {invitationUrl && (
        <div className="mt-6 rounded-lg border border-border bg-background p-4">
          <h3 className="text-sm font-semibold text-foreground">
            Invitation link created
          </h3>

          <p className="mt-1 text-xs text-muted">
            Share this link with the invited person. It expires after 7 days.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              readOnly
              value={invitationUrl}
              aria-label="Invitation URL"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground"
            />

            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-secondary"
            >
              Copy link
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
