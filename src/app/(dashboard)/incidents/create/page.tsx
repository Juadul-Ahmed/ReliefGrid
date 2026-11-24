
import Link from "next/link";
import { HiOutlineArrowLeft } from "react-icons/hi2";

import { CreateIncidentForm } from "@/components/incidents/CreateIncidentForm";

export default function CreateIncidentPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/incidents"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
        >
          <HiOutlineArrowLeft className="size-4" />
          Back to Incidents
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">
          Create Incident
        </h1>

        <p className="mt-1 text-sm text-muted">
          Report a new emergency incident and provide the necessary details.
        </p>
      </div>

      {/* Form */}
      <CreateIncidentForm />
    </div>
  );
}
