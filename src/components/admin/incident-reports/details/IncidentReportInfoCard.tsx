
import {
  HiOutlineDocumentText,
  HiOutlineMapPin,
  HiOutlineUser,
} from "react-icons/hi2";

import type {
  IncidentCategory,
  IncidentSeverity,
  IncidentReportSource,
} from "@/generated/prisma/enums";

interface IncidentReportInfoCardProps {
  report: {
    title: string;
    description: string;
    category: IncidentCategory;
    severity: IncidentSeverity;
    source: IncidentReportSource;
    locationName: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    submitter: {
      name: string;
      email: string;
      createdAt: Date;
    } | null;
  };
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}

export default function IncidentReportInfoCard({
  report,
}: IncidentReportInfoCardProps) {
  return (
    <div className="space-y-6">
      {/* Report description */}
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <HiOutlineDocumentText className="size-5 text-muted" />
          <h2 className="font-semibold text-foreground">
            Report Information
          </h2>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <DetailItem label="Category" value={report.category.replaceAll("_", " ")} />
          <DetailItem label="Severity" value={report.severity} />
          <DetailItem label="Source" value={report.source.replaceAll("_", " ")} />
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Description
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">
            {report.description}
          </p>
        </div>
      </section>

      {/* Submitter */}
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <HiOutlineUser className="size-5 text-muted" />
          <h2 className="font-semibold text-foreground">
            Submitter Information
          </h2>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <DetailItem
            label="Name"
            value={report.submitter?.name ?? "Anonymous"}
          />

          <DetailItem
            label="Email"
            value={report.submitter?.email ?? "Not available"}
          />

          <DetailItem
            label="Account Created"
            value={
              report.submitter?.createdAt.toLocaleDateString() ??
              "Not available"
            }
          />
        </div>
      </section>

      {/* Location */}
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <HiOutlineMapPin className="size-5 text-muted" />
          <h2 className="font-semibold text-foreground">
            Location Information
          </h2>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <DetailItem
            label="Location Name"
            value={report.locationName || "Not provided"}
          />

          <DetailItem
            label="Address"
            value={report.address || "Not provided"}
          />

          <DetailItem
            label="Latitude"
            value={report.latitude?.toString() ?? "Not provided"}
          />

          <DetailItem
            label="Longitude"
            value={report.longitude?.toString() ?? "Not provided"}
          />
        </div>
      </section>
    </div>
  );
}
