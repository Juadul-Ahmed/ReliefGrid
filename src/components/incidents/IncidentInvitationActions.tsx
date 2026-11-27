"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import {
  acceptIncidentInvitation,
  rejectIncidentInvitation,
} from "@/app/actions/incident-participants";

interface IncidentInvitationActionsProps {
  participantId: string;
  canRespond: boolean;
}

export function IncidentInvitationActions({
  participantId,
  canRespond,
}: IncidentInvitationActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleResponse(decision: "ACCEPT" | "REJECT") {
    startTransition(async () => {
      const result =
        decision === "ACCEPT"
          ? await acceptIncidentInvitation(participantId)
          : await rejectIncidentInvitation(participantId);

      if (!result.success) {
        toast.error(result.message);
        router.refresh();
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  if (!canRespond) {
    return (
      <p className="text-xs text-muted">
        Only organization owners and admins can respond.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleResponse("ACCEPT")}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Processing..." : "Accept"}
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={() => handleResponse("REJECT")}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}