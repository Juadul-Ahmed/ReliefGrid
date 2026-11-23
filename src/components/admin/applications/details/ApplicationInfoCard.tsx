
import {
  HiOutlineBuildingOffice2,
  HiOutlineEnvelope,
  HiOutlineUser,
} from "react-icons/hi2";

import ApplicationDetailItem from "./ApplicationDetailItem";

interface ApplicationInfoCardProps {
  organization: {
    name: string;
    slug: string;
    type: string;
    description: string | null;
    address: string | null;
    contactEmail: string;
    contactPhone: string | null;
  };
  applicant: {
    name: string;
    email: string;
    createdAt: Date;
  };
}

export default function ApplicationInfoCard({
  organization,
  applicant,
}: ApplicationInfoCardProps) {
  return (
    <div className="space-y-6">
      {/* Organization */}
      <section className="rounded-2xl border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <HiOutlineBuildingOffice2 className="size-5 text-primary" />
          <h2 className="font-semibold text-foreground">
            Organization Information
          </h2>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-2">
          <ApplicationDetailItem
            label="Organization Name"
            value={organization.name}
          />

          <ApplicationDetailItem
            label="Organization Type"
            value={organization.type}
          />

          <ApplicationDetailItem
            label="Requested URL"
            value={`/${organization.slug}`}
          />

          <ApplicationDetailItem
            label="Address"
            value={organization.address}
          />

          <div className="sm:col-span-2">
            <ApplicationDetailItem
              label="Description"
              value={organization.description}
            />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <HiOutlineEnvelope className="size-5 text-primary" />
          <h2 className="font-semibold text-foreground">
            Contact Information
          </h2>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-2">
          <ApplicationDetailItem
            label="Contact Email"
            value={organization.contactEmail}
          />

          <ApplicationDetailItem
            label="Contact Phone"
            value={organization.contactPhone}
          />
        </div>
      </section>

      {/* Applicant */}
      <section className="rounded-2xl border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border p-5">
          <HiOutlineUser className="size-5 text-primary" />
          <h2 className="font-semibold text-foreground">
            Applicant Information
          </h2>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-2">
          <ApplicationDetailItem
            label="Applicant Name"
            value={applicant.name}
          />

          <ApplicationDetailItem
            label="Account Email"
            value={applicant.email}
          />

          <ApplicationDetailItem
            label="Account Created"
            value={applicant.createdAt.toLocaleDateString()}
          />
        </div>
      </section>
    </div>
  );
}
