-- CreateEnum
CREATE TYPE "OrganizationApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "OrganizationDeletionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('MEDICAL', 'RESCUE', 'FIRE_RESPONSE', 'LOGISTICS', 'TRANSPORTATION', 'SHELTER_SUPPORT', 'COMMUNICATION', 'GENERAL_RESPONSE', 'OTHER');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('FORMING', 'ACTIVE', 'DEPLOYED', 'UNAVAILABLE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('LEADER', 'DEPUTY_LEADER', 'MEMBER');

-- CreateEnum
CREATE TYPE "TeamMemberStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LEFT');

-- CreateEnum
CREATE TYPE "IncidentReportStatus" AS ENUM ('RECEIVED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "IncidentCategory" AS ENUM ('FIRE', 'FLOOD', 'EARTHQUAKE', 'LANDSLIDE', 'STORM', 'MEDICAL', 'ACCIDENT', 'MISSING_PERSON', 'OTHER');

-- CreateEnum
CREATE TYPE "IncidentReportSource" AS ENUM ('PUBLIC', 'USER', 'ORGANIZATION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'ASSESSING', 'ACTIVE', 'CONTAINED', 'RESOLVED', 'CLOSED', 'SUSPENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IncidentParticipantStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'WITHDRAWN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "IncidentParticipantRoleType" AS ENUM ('MEDICAL', 'LOGISTICS', 'RESCUE', 'SUPPORT');

-- CreateEnum
CREATE TYPE "IncidentParticipantPermissionType" AS ENUM ('VIEW_INCIDENT', 'UPDATE_INCIDENT', 'MANAGE_REQUESTS', 'VIEW_RESOURCES', 'PROPOSE_ALLOCATIONS', 'MANAGE_ASSIGNMENTS', 'VIEW_REPORTS');

-- CreateEnum
CREATE TYPE "IncidentLeadTransferStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "IncidentUpdateVisibility" AS ENUM ('LEAD_ORGANIZATION', 'PARTICIPATING_ORGANIZATIONS', 'PUBLIC');

-- CreateEnum
CREATE TYPE "IncidentAssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "IncidentAssignmentPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "IncidentAttachmentVisibility" AS ENUM ('PRIVATE', 'PARTICIPANTS');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "systemRole" TEXT NOT NULL DEFAULT 'USER',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "activeOrganizationId" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviterId" TEXT NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_application" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "requestedSlug" TEXT NOT NULL,
    "organizationType" TEXT NOT NULL,
    "description" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "address" TEXT,
    "status" "OrganizationApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "organizationId" TEXT,
    "approvedOrganizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_deletion_request" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "status" "OrganizationDeletionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "reviewNotes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_deletion_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorType" "AuditActorType" NOT NULL DEFAULT 'USER',
    "actorNameSnapshot" TEXT,
    "organizationId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teamType" "TeamType" NOT NULL,
    "status" "TeamStatus" NOT NULL DEFAULT 'FORMING',
    "leaderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_member" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "TeamMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "addedById" TEXT,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_report" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "IncidentCategory" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "source" "IncidentReportSource" NOT NULL DEFAULT 'PUBLIC',
    "submitterId" TEXT,
    "locationName" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "IncidentReportStatus" NOT NULL DEFAULT 'RECEIVED',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "duplicateOfReportId" TEXT,
    "incidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident" (
    "id" TEXT NOT NULL,
    "incidentNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "IncidentCategory" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "leadOrganizationId" TEXT NOT NULL,
    "locationName" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "occurredAt" TIMESTAMP(3),
    "createdById" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_participant" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "IncidentParticipantStatus" NOT NULL DEFAULT 'INVITED',
    "joinedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_participant_role" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "role" "IncidentParticipantRoleType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_participant_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_participant_permission" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "permission" "IncidentParticipantPermissionType" NOT NULL,
    "grantedById" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_participant_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_lead_transfer" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "fromOrganizationId" TEXT NOT NULL,
    "toOrganizationId" TEXT NOT NULL,
    "status" "IncidentLeadTransferStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reason" TEXT,
    "reviewNotes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_lead_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_update" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "visibility" "IncidentUpdateVisibility" NOT NULL DEFAULT 'LEAD_ORGANIZATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_update_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_note" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_assignment" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "teamId" TEXT,
    "assigneeUserId" TEXT,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IncidentAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "IncidentAssignmentPriority" NOT NULL DEFAULT 'NORMAL',
    "dueAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_attachment" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "visibility" "IncidentAttachmentVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "organization_status_idx" ON "organization"("status");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "member"("organizationId");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "member_organizationId_userId_key" ON "member"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organization_application_approvedOrganizationId_key" ON "organization_application"("approvedOrganizationId");

-- CreateIndex
CREATE INDEX "organization_application_applicantId_idx" ON "organization_application"("applicantId");

-- CreateIndex
CREATE INDEX "organization_application_status_createdAt_idx" ON "organization_application"("status", "createdAt");

-- CreateIndex
CREATE INDEX "organization_application_requestedSlug_idx" ON "organization_application"("requestedSlug");

-- CreateIndex
CREATE INDEX "organization_deletion_request_organizationId_status_idx" ON "organization_deletion_request"("organizationId", "status");

-- CreateIndex
CREATE INDEX "organization_deletion_request_requestedById_idx" ON "organization_deletion_request"("requestedById");

-- CreateIndex
CREATE INDEX "organization_deletion_request_reviewedById_idx" ON "organization_deletion_request"("reviewedById");

-- CreateIndex
CREATE INDEX "audit_log_actorUserId_createdAt_idx" ON "audit_log"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_organizationId_createdAt_idx" ON "audit_log"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_entityType_entityId_idx" ON "audit_log"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_action_createdAt_idx" ON "audit_log"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_requestId_idx" ON "audit_log"("requestId");

-- CreateIndex
CREATE INDEX "team_organizationId_status_idx" ON "team"("organizationId", "status");

-- CreateIndex
CREATE INDEX "team_leaderId_idx" ON "team"("leaderId");

-- CreateIndex
CREATE INDEX "team_member_userId_status_idx" ON "team_member"("userId", "status");

-- CreateIndex
CREATE INDEX "team_member_teamId_status_idx" ON "team_member"("teamId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_teamId_userId_key" ON "team_member"("teamId", "userId");

-- CreateIndex
CREATE INDEX "incident_report_status_createdAt_idx" ON "incident_report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "incident_report_category_severity_idx" ON "incident_report"("category", "severity");

-- CreateIndex
CREATE INDEX "incident_report_submitterId_idx" ON "incident_report"("submitterId");

-- CreateIndex
CREATE INDEX "incident_report_verifiedById_idx" ON "incident_report"("verifiedById");

-- CreateIndex
CREATE INDEX "incident_report_incidentId_idx" ON "incident_report"("incidentId");

-- CreateIndex
CREATE INDEX "incident_report_duplicateOfReportId_idx" ON "incident_report"("duplicateOfReportId");

-- CreateIndex
CREATE UNIQUE INDEX "incident_incidentNumber_key" ON "incident"("incidentNumber");

-- CreateIndex
CREATE INDEX "incident_status_severity_idx" ON "incident"("status", "severity");

-- CreateIndex
CREATE INDEX "incident_category_idx" ON "incident"("category");

-- CreateIndex
CREATE INDEX "incident_leadOrganizationId_status_idx" ON "incident"("leadOrganizationId", "status");

-- CreateIndex
CREATE INDEX "incident_createdById_idx" ON "incident"("createdById");

-- CreateIndex
CREATE INDEX "incident_verifiedById_idx" ON "incident"("verifiedById");

-- CreateIndex
CREATE INDEX "incident_occurredAt_idx" ON "incident"("occurredAt");

-- CreateIndex
CREATE INDEX "incident_participant_organizationId_status_idx" ON "incident_participant"("organizationId", "status");

-- CreateIndex
CREATE INDEX "incident_participant_incidentId_status_idx" ON "incident_participant"("incidentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "incident_participant_incidentId_organizationId_key" ON "incident_participant"("incidentId", "organizationId");

-- CreateIndex
CREATE INDEX "incident_participant_role_role_idx" ON "incident_participant_role"("role");

-- CreateIndex
CREATE UNIQUE INDEX "incident_participant_role_participantId_role_key" ON "incident_participant_role"("participantId", "role");

-- CreateIndex
CREATE INDEX "incident_participant_permission_participantId_permission_idx" ON "incident_participant_permission"("participantId", "permission");

-- CreateIndex
CREATE INDEX "incident_participant_permission_grantedById_idx" ON "incident_participant_permission"("grantedById");

-- CreateIndex
CREATE INDEX "incident_lead_transfer_incidentId_status_idx" ON "incident_lead_transfer"("incidentId", "status");

-- CreateIndex
CREATE INDEX "incident_lead_transfer_fromOrganizationId_idx" ON "incident_lead_transfer"("fromOrganizationId");

-- CreateIndex
CREATE INDEX "incident_lead_transfer_toOrganizationId_idx" ON "incident_lead_transfer"("toOrganizationId");

-- CreateIndex
CREATE INDEX "incident_lead_transfer_requestedById_idx" ON "incident_lead_transfer"("requestedById");

-- CreateIndex
CREATE INDEX "incident_update_incidentId_createdAt_idx" ON "incident_update"("incidentId", "createdAt");

-- CreateIndex
CREATE INDEX "incident_update_organizationId_createdAt_idx" ON "incident_update"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "incident_update_authorId_idx" ON "incident_update"("authorId");

-- CreateIndex
CREATE INDEX "incident_update_visibility_idx" ON "incident_update"("visibility");

-- CreateIndex
CREATE INDEX "incident_note_incidentId_createdAt_idx" ON "incident_note"("incidentId", "createdAt");

-- CreateIndex
CREATE INDEX "incident_note_organizationId_createdAt_idx" ON "incident_note"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "incident_note_authorId_idx" ON "incident_note"("authorId");

-- CreateIndex
CREATE INDEX "incident_assignment_incidentId_status_idx" ON "incident_assignment"("incidentId", "status");

-- CreateIndex
CREATE INDEX "incident_assignment_teamId_status_idx" ON "incident_assignment"("teamId", "status");

-- CreateIndex
CREATE INDEX "incident_assignment_assigneeUserId_status_idx" ON "incident_assignment"("assigneeUserId", "status");

-- CreateIndex
CREATE INDEX "incident_assignment_createdById_idx" ON "incident_assignment"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "incident_attachment_storageKey_key" ON "incident_attachment"("storageKey");

-- CreateIndex
CREATE INDEX "incident_attachment_incidentId_createdAt_idx" ON "incident_attachment"("incidentId", "createdAt");

-- CreateIndex
CREATE INDEX "incident_attachment_uploadedById_idx" ON "incident_attachment"("uploadedById");

-- CreateIndex
CREATE INDEX "incident_attachment_visibility_idx" ON "incident_attachment"("visibility");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_application" ADD CONSTRAINT "organization_application_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_application" ADD CONSTRAINT "organization_application_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_application" ADD CONSTRAINT "organization_application_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_application" ADD CONSTRAINT "organization_application_approvedOrganizationId_fkey" FOREIGN KEY ("approvedOrganizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_deletion_request" ADD CONSTRAINT "organization_deletion_request_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_deletion_request" ADD CONSTRAINT "organization_deletion_request_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_deletion_request" ADD CONSTRAINT "organization_deletion_request_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_report" ADD CONSTRAINT "incident_report_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_report" ADD CONSTRAINT "incident_report_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_report" ADD CONSTRAINT "incident_report_duplicateOfReportId_fkey" FOREIGN KEY ("duplicateOfReportId") REFERENCES "incident_report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_report" ADD CONSTRAINT "incident_report_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident" ADD CONSTRAINT "incident_leadOrganizationId_fkey" FOREIGN KEY ("leadOrganizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident" ADD CONSTRAINT "incident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident" ADD CONSTRAINT "incident_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_participant" ADD CONSTRAINT "incident_participant_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_participant" ADD CONSTRAINT "incident_participant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_participant_role" ADD CONSTRAINT "incident_participant_role_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "incident_participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_participant_permission" ADD CONSTRAINT "incident_participant_permission_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "incident_participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_participant_permission" ADD CONSTRAINT "incident_participant_permission_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_lead_transfer" ADD CONSTRAINT "incident_lead_transfer_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_lead_transfer" ADD CONSTRAINT "incident_lead_transfer_fromOrganizationId_fkey" FOREIGN KEY ("fromOrganizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_lead_transfer" ADD CONSTRAINT "incident_lead_transfer_toOrganizationId_fkey" FOREIGN KEY ("toOrganizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_lead_transfer" ADD CONSTRAINT "incident_lead_transfer_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_lead_transfer" ADD CONSTRAINT "incident_lead_transfer_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_update" ADD CONSTRAINT "incident_update_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_update" ADD CONSTRAINT "incident_update_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_update" ADD CONSTRAINT "incident_update_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_note" ADD CONSTRAINT "incident_note_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_note" ADD CONSTRAINT "incident_note_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_note" ADD CONSTRAINT "incident_note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_assignment" ADD CONSTRAINT "incident_assignment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_assignment" ADD CONSTRAINT "incident_assignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_assignment" ADD CONSTRAINT "incident_assignment_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_assignment" ADD CONSTRAINT "incident_assignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_attachment" ADD CONSTRAINT "incident_attachment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_attachment" ADD CONSTRAINT "incident_attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;





-- ============================================================
-- ReliefGrid: Additional database integrity constraints
-- ============================================================

-- 1. A team can have at most one active leader.
CREATE UNIQUE INDEX "team_member_one_active_leader"
ON "team_member" ("teamId")
WHERE "role" = 'LEADER' AND "status" = 'ACTIVE';

-- 2. Prevent duplicate active permissions.
-- Revoked permissions remain in the database as history.
CREATE UNIQUE INDEX "incident_permission_one_active"
ON "incident_participant_permission" ("participantId", "permission")
WHERE "revokedAt" IS NULL;

-- 3. Only one active lead transfer per incident.
CREATE UNIQUE INDEX "incident_lead_transfer_one_active"
ON "incident_lead_transfer" ("incidentId")
WHERE "status" IN ('REQUESTED', 'ACCEPTED');

-- 4. An assignment must target exactly one recipient:
-- either a team or an individual user, never both or neither.
ALTER TABLE "incident_assignment"
ADD CONSTRAINT "incident_assignment_exactly_one_target"
CHECK (
    ("teamId" IS NOT NULL AND "assigneeUserId" IS NULL)
    OR
    ("teamId" IS NULL AND "assigneeUserId" IS NOT NULL)
);

-- 5. A verified report must have a verifier and verification time.
ALTER TABLE "incident_report"
ADD CONSTRAINT "incident_report_verified_metadata_check"
CHECK (
    "status" <> 'VERIFIED'
    OR ("verifiedById" IS NOT NULL AND "verifiedAt" IS NOT NULL)
);

-- 6. A duplicate report must reference another report.
ALTER TABLE "incident_report"
ADD CONSTRAINT "incident_report_duplicate_reference_check"
CHECK (
    "status" <> 'DUPLICATE'
    OR "duplicateOfReportId" IS NOT NULL
);

-- 7. A report cannot reference itself as its duplicate.
ALTER TABLE "incident_report"
ADD CONSTRAINT "incident_report_no_self_duplicate"
CHECK (
    "duplicateOfReportId" IS NULL
    OR "duplicateOfReportId" <> "id"
);

-- 8. Latitude and longitude must be within valid geographic ranges.
ALTER TABLE "incident_report"
ADD CONSTRAINT "incident_report_latitude_range"
CHECK ("latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90));

ALTER TABLE "incident_report"
ADD CONSTRAINT "incident_report_longitude_range"
CHECK ("longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180));

ALTER TABLE "incident"
ADD CONSTRAINT "incident_latitude_range"
CHECK ("latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90));

ALTER TABLE "incident"
ADD CONSTRAINT "incident_longitude_range"
CHECK ("longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180));

-- 9. Incident verification metadata must be supplied together.
ALTER TABLE "incident"
ADD CONSTRAINT "incident_verified_metadata_pair"
CHECK (
    ("verifiedById" IS NULL AND "verifiedAt" IS NULL)
    OR
    ("verifiedById" IS NOT NULL AND "verifiedAt" IS NOT NULL)
);

-- 10. Attachments must have a positive file size.
ALTER TABLE "incident_attachment"
ADD CONSTRAINT "incident_attachment_positive_file_size"
CHECK ("fileSize" > 0);

-- 11. An organization can have only one pending deletion request.
CREATE UNIQUE INDEX "organization_deletion_one_pending"
ON "organization_deletion_request" ("organizationId")
WHERE "status" = 'PENDING';
