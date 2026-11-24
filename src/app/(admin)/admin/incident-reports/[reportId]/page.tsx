import { notFound } from "next/navigation";

import IncidentReportDetailsHeader from "@/components/admin/incident-reports/details/IncidentReportDetailsHeader";
import IncidentReportInfoCard from "@/components/admin/incident-reports/details/IncidentReportInfoCard";
import IncidentReportReviewCard from "@/components/admin/incident-reports/details/IncidentReportReviewCard";
import IncidentReportReviewActions from "@/components/admin/incident-reports/details/IncidentReportReviewActions";

import {
  getIncidentReportById,
  getVerifiedIncidentReports,
} from "@/lib/incidents/report-queries";

interface IncidentReportDetailsPageProps {
  params: Promise<{
    reportId: string;
  }>;
}

export default async function IncidentReportDetailsPage({
  params,
}: IncidentReportDetailsPageProps) {
  const { reportId } = await params;

  const report = await getIncidentReportById(reportId);

  if (!report) {
    notFound();
  }

  const verifiedReports =
    report.status === "UNDER_REVIEW"
      ? await getVerifiedIncidentReports(report.id)
      : [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <IncidentReportDetailsHeader
        title={report.title}
        status={report.status}
        reportId={report.id}
      />

      <IncidentReportInfoCard report={report} />

      <IncidentReportReviewCard report={report} />

      <IncidentReportReviewActions
        reportId={report.id}
        status={report.status}
        verifiedReports={verifiedReports}
      />
    </div>
  );
}