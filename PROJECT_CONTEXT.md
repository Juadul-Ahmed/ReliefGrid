# ReliefGrid — Project Context

Read-only audit of the repository for an assistant that cannot see the code.
Source: `D:\L!-Project 5\reliefgrid`. No project files were modified.
Values from `.env` are intentionally omitted; only variable names are listed.

---

## 1. STACK AND SCRIPTS

### Exact versions from package.json

| Package | Version |
|---|---|
| next | 16.4.6 |
| react | 19.3.0 |
| react-dom | 19.3.0 |
| typescript | ^5 |
| prisma | ^7.10.1 |
| @prisma/client | ^7.10.1 |
| @prisma/adapter-pg | ^7.10.1 |
| zod | ^4.6.7 |
| react-hook-form | ^7.92.0 |
| @hookform/resolvers | ^7.0.8 |
| better-auth | ^1.7.27 |
| @better-auth/prisma-adapter | ^1.7.27 |
| tailwindcss | 4.3.3 |
| @tailwindcss/turbopack | 4.3.3 |
| heroui (@heroui/react) | ^3.2.7 (imported in a few components; not a design-system foundation) |
| react-icons | ^5.7.0 |
| react-toastify | ^11.2.0 |
| @teispace/next-themes | ^3.1.1 (theme provider; unusual package name, not `next-themes`) |
| pg | ^8.23.1 |
| dotenv | ^18.0.10 |
| tsx | ^4.23.15 |
| eslint | ^9 |
| eslint-config-next | 16.4.6 |
| vitest | ^4.1.12 |
| @better-auth/cli | ^1.4.21 |

### npm scripts (package.json)

- `dev` — `next dev`
- `build` — `next build`
- `start` — `next start`
- `lint` — `eslint`
- `test` — `vitest run`
- `test:watch` — `vitest`

No `typecheck` script. TypeScript is invoked by `next build` / eslint-config-next/typescript.

### Prisma config

`prisma.config.ts` (repo root):

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DATABASE_URL"] },
});
```

`prisma/schema.prisma` generator block:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

Resolved output path: `src/generated/prisma` (relative to `prisma/schema.prisma`).
Datasource provider: `postgresql`. Connection uses `DATABASE_URL_POOLED` via `@prisma/adapter-pg` (`PrismaPg`) in `src/lib/db/prisma.ts`; better-auth's `prismaAdapter` uses the same `prisma` client instance. Prisma 7 does not emit a `schema.prisma` file for the client generator (standard for v7).

Environment variables referenced by code (`.env` present but not printed): `DATABASE_URL`, `DATABASE_URL_POOLED`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

---

## 2. FOLDER LAYOUT AND CONVENTIONS

### Pruned tree of src/ (folders with one-line purpose)

```
src/
  app/              Next.js App Router: route groups (admin), (auth), (dashboard),
                    top-level routes, server actions, API route
  components/       React components: admin, auth, incidents, landing, layout,
                    onboarding, organization, providers, shared (empty), ui
  features/         Domain features; only dashboard has code; others empty
    dashboard/      Dashboard overview (demo data), components, data, types
    allocations/    EMPTY
    analytics/      EMPTY
    incidents/      EMPTY (incident logic lives in src/lib/incidents and app/actions)
    organizations/  EMPTY
    requests/       EMPTY
    resources/      EMPTY
    shelters/       EMPTY
    teams/          EMPTY
    volunteers/     EMPTY
  generated/        Prisma client output (ignored per audit rules)
  hooks/            EMPTY
  lib/              Shared logic: auth, db, incidents, permissions, validations
    auth/           session.ts (requireAuth, getCurrentSession)
    db/             prisma.ts (singleton PrismaClient with pooled adapter)
    incidents/      queries.ts, report-queries.ts
    permissions/    organization.ts, organization-role.ts, organization-permissions.ts,
                    require-organization-permission.ts, system-admin.ts (+ tests)
    utils/          EMPTY (no cn() helper exists anywhere)
    validations/    Zod schemas (auth, incident, incident-coordinator, incident-participant,
                    incident-severity, incident-status, incident-report-review,
                    organization-application, organization-application-review,
                    organization-invitation)
  services/         EMPTY
  store/            EMPTY
  types/            EMPTY
```

### Naming conventions actually used

- Components: PascalCase, exported as named or default (`CreateIncidentForm`, `DashboardSidebar`, `AuthForm`, `AdminShell`).
- Server actions: `app/actions/<domain>.ts`, function names like `createIncident`, `updateIncidentStatus`, `reviewOrganizationApplication`, `inviteIncidentParticipant`, `acceptOrganizationInvitation`.
- Validation schemas: `lib/validations/<name>.schema.ts`, exported `*Schema` (`createIncidentSchema`, `organizationApplicationSchema`) plus inferred `*FormValues` / `*Input` types.
- Query files: `lib/incidents/queries.ts`, `lib/incidents/report-queries.ts` — scope functions prefixed `get*`, filter builder `buildIncidentFilters`.
- Routes: Next.js App Router segments under `src/app`; route groups `(admin)`, `(auth)`, `(dashboard)`; dynamic segments `[incidentId]`, `[applicationId]`, `[reportId]`.
- Tests: colocated with source as `*.test.ts` (e.g. `organization.test.ts`).

### Inconsistencies noticed

- `OrganizationApplicationForm.tsx` validates manually with `schema.safeParse` instead of `zodResolver` like every other form, and does not call `router.refresh()` after submit.
- `OrganizationInvitationForm.tsx` uses uncontrolled React state, no react-hook-form/zod at all.
- Auth accessor is inconsistent: some actions use `auth.api.getSession({ headers })`, others use `getCurrentSession()` from `lib/auth/session`.
- Role casing: `Member.role` in the DB is lowercase (`"owner"`, `"admin"`, `"member"`, default `"member"`), while the TypeScript `OrganizationRole` type is uppercase (`OWNER`/`ADMIN`/`MEMBER`); code calls `.toUpperCase()` on every read.
- Empty/unused folders: `src/hooks`, `src/services`, `src/store`, `src/types`, `src/lib/utils`, `src/components/shared`, plus all feature folders except `dashboard` (`features/incidents` is empty even though incident query code lives in `lib/incidents`).
- Dead/empty files: `src/components/auth/Loginform.tsx` and `src/components/auth/RegisterForm.tsx` are 0 bytes and unused (`AuthForm.tsx` handles both modes).
- `src/lib/utils` is empty: no shared `cn()` utility; all classes are inline strings.

---

## 3. AUTH, SESSION, AND ORGANIZATION FLOW

### Better Auth configuration (`src/lib/auth.ts`)

```ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true },
  user: { additionalFields: { systemRole: { type: "string", required: true,
    defaultValue: "USER", input: false } } },
  session: { additionalFields: { activeOrganizationId: {
    type: "string", required: false, input: false } } },
  plugins: [
    organization({
      allowUserToCreateOrganization: false,
      requireEmailVerificationOnInvitation: false,
      invitationExpiresIn: 60 * 60 * 24 * 7,
      organization: { additionalFields: { status: { type: "string", required: true,
        defaultValue: "PENDING", input: false } } },
      schema: { member: { additionalFields: { status: { type: "string", required: true,
        defaultValue: "ACTIVE", input: false } } } },
    }),
  ],
});
```

- Email/password only (no OAuth providers configured).
- `allowUserToCreateOrganization: false`: organizations are created only via application approval (`reviewOrganizationApplication` action), never by self-registration.
- `systemRole` is `additionalFields` on User with default `"USER"`; `"SYSTEM_ADMIN"` must be set directly in the DB (script `scripts/promote-system-admin.ts` exists).
- Session carries `activeOrganizationId`.
- API handler: `src/app/api/auth/[...all]/route.ts` exports `GET`, `POST` via `toNextJsHandler(auth)`.
- Client: `src/lib/auth-client.ts` exports `signIn`, `signUp`, `signOut`, `useSession`, `organization` (with `organizationClient()` plugin).

### requireAuth, requireOrganization, requireOrganizationPermission

`src/lib/auth/session.ts`:

```ts
export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session) { redirect("/login"); }
  return session;
}
```

- `requireAuth`: checks session; redirects to `/login` if missing; returns the session.
- `requireOrganization` (`src/lib/permissions/organization.ts`): calls `requireAuth`; redirects SYSTEM_ADMIN users to `/admin`; redirects to `/onboarding` when `session.session.activeOrganizationId` is missing; verifies the organization is `status: "ACTIVE"` and the user has an `ACTIVE` membership, else `/onboarding`; returns `{ session, organizationId, organization, membership }`.
- `requireOrganizationRole` (`src/lib/permissions/organization-role.ts`): calls `requireOrganization`; uppercases `membership.role`; redirects to `/dashboard` when the role is not in `allowedRoles`; returns context with `role: OrganizationRole`.
- `requireOrganizationPermission` (`src/lib/permissions/require-organization-permission.ts`): calls `requireOrganization`; checks `hasOrganizationPermission(role, permission)`; redirects to `/dashboard` on denial; returns context with `role` and `permission`.
- `requireSystemAdmin` (`src/lib/permissions/system-admin.ts`): `requireAuth`; redirects to `/onboarding` unless `systemRole === "SYSTEM_ADMIN"`.

### Role model and permission matrix

Roles: `OWNER`, `ADMIN`, `MEMBER` (stored lowercase in `Member.role`, normalized with `.toUpperCase()` in code).

Full matrix from `src/lib/permissions/organization-permissions.ts`:

| Permission | OWNER | ADMIN | MEMBER |
|---|---|---|---|
| VIEW_ORGANIZATION | yes | yes | yes |
| MANAGE_MEMBERS | yes | yes | no |
| UPDATE_SETTINGS | yes | yes | no |
| DELETE_ORGANIZATION | yes | no | no |
| TRANSFER_OWNERSHIP | yes | no | no |
| CREATE_INCIDENT | yes | yes | yes |
| ASSIGN_INCIDENT_COORDINATOR | yes | yes | no |
| UPDATE_INCIDENT_STATUS | yes | yes | no |
| UPDATE_INCIDENT_SEVERITY | yes | yes | no |
| MANAGE_INCIDENT_PARTICIPANTS | yes | yes | no |
| RESPOND_TO_INCIDENT_INVITATIONS | yes | yes | no |

`hasOrganizationPermission(role, permission)` returns false for any role not in `[OWNER, ADMIN, MEMBER]`.

### Route groups and layouts

- `(admin)/layout.tsx` (`src/app/(admin)/layout.tsx`): Server; requires session (else `/login`) and `systemRole === "SYSTEM_ADMIN"` (else `/onboarding`); renders `AdminShell` (client). Covers `/admin`, `/admin/applications`, `/admin/applications/[applicationId]`, `/admin/incident-reports`, `/admin/incident-reports/[reportId]`. Sidebar also links to nonexistent `/admin/organizations`, `/admin/users`, `/admin/audit-logs`, `/admin/settings`.
- `(dashboard)/layout.tsx` (`src/app/(dashboard)/layout.tsx`): Server; `requireAuth`; SYSTEM_ADMIN → `/admin`; `requireOrganization` (else `/onboarding`); renders `DashboardShell` (client). Covers `/dashboard`, `/incidents`, `/incidents/create`, `/incidents/[incidentId]`, `/incident-invitations`, `/settings`, `/settings/members`.
- `(auth)`: no layout; `/login` and `/register` are Server pages wrapping the client `AuthForm`.
- `onboarding/` (top-level segments, not a route group): `/onboarding` and `/onboarding/organization`; both redirect authenticated users with an active organization to `/dashboard`, SYSTEM_ADMIN to `/admin`; `/onboarding` auto-activates an existing active membership via `auth.api.setActiveOrganization`.
- `/invitations/accept`: standalone Server page; renders `InvitationAcceptanceCard` (client) which calls accept/reject actions.
- All pages and layouts under `src/app` are Server Components (no `"use client"` anywhere in `app/`). Client behavior lives in `components/` and `features/`.

---

## 4. DATABASE SCHEMA SUMMARY

Provider: postgresql. Generator output: `src/generated/prisma`. All `@relation` names are explicit. `onDelete` behavior is specified per relation (Cascade for auth tables; Restrict/SetNull elsewhere).

### Enums and values

| Enum | Values |
|---|---|
| OrganizationApplicationStatus | PENDING, UNDER_REVIEW, APPROVED, REJECTED, WITHDRAWN |
| OrganizationDeletionRequestStatus | PENDING, APPROVED, REJECTED, CANCELLED |
| AuditActorType | USER, SYSTEM |
| TeamType | MEDICAL, RESCUE, FIRE_RESPONSE, LOGISTICS, TRANSPORTATION, SHELTER_SUPPORT, COMMUNICATION, GENERAL_RESPONSE, OTHER |
| TeamStatus | FORMING, ACTIVE, DEPLOYED, UNAVAILABLE, INACTIVE |
| TeamMemberRole | LEADER, DEPUTY_LEADER, MEMBER |
| TeamMemberStatus | ACTIVE, SUSPENDED, LEFT |
| IncidentReportStatus | RECEIVED, UNDER_REVIEW, VERIFIED, REJECTED, DUPLICATE |
| IncidentCategory | FIRE, FLOOD, EARTHQUAKE, LANDSLIDE, STORM, MEDICAL, ACCIDENT, MISSING_PERSON, OTHER |
| IncidentReportSource | PUBLIC, USER, ORGANIZATION, SYSTEM |
| IncidentSeverity | LOW, MODERATE, HIGH, CRITICAL |
| IncidentStatus | OPEN, ASSESSING, ACTIVE, CONTAINED, RESOLVED, CLOSED, SUSPENDED, CANCELLED |
| IncidentParticipantStatus | INVITED, ACTIVE, REJECTED, EXPIRED, SUSPENDED, WITHDRAWN, COMPLETED |
| IncidentParticipantRoleType | MEDICAL, LOGISTICS, RESCUE, SUPPORT |
| IncidentParticipantPermissionType | VIEW_INCIDENT, UPDATE_INCIDENT, MANAGE_REQUESTS, VIEW_RESOURCES, PROPOSE_ALLOCATIONS, MANAGE_ASSIGNMENTS, VIEW_REPORTS |
| IncidentLeadTransferStatus | REQUESTED, ACCEPTED, COMPLETED, REJECTED, CANCELLED, EXPIRED |
| IncidentUpdateVisibility | LEAD_ORGANIZATION, PARTICIPATING_ORGANIZATIONS, PUBLIC |
| IncidentAssignmentStatus | PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED |
| IncidentAssignmentPriority | LOW, NORMAL, HIGH, URGENT |
| IncidentAttachmentVisibility | PRIVATE, PARTICIPANTS |
| EmergencyRequestStatus | OPEN, IN_PROGRESS, PARTIALLY_FULFILLED, FULFILLED, CLOSED, CANCELLED |
| EmergencyRequestPriority | LOW, NORMAL, HIGH, CRITICAL |
| EmergencyRequestVisibility | ORGANIZATION, INCIDENT_PARTICIPANTS, NETWORK |
| EmergencyItemCategory | FOOD, WATER, MEDICAL_SUPPLIES, SHELTER_SUPPLIES, CLOTHING, FUEL, EQUIPMENT, PERSONNEL, TRANSPORTATION, COMMUNICATION, OTHER |
| EmergencyRequestItemStatus | OPEN, PARTIALLY_FULFILLED, FULFILLED, CANCELLED |
| EmergencyFulfillmentStatus | OFFERED, ACCEPTED, IN_TRANSIT, DELIVERED, REJECTED, WITHDRAWN, CANCELLED |

### Models (compact)

- **User**: auth core. Fields: id, name, email (unique), emailVerified, image, systemRole (default "USER"), timestamps. Relations: sessions, accounts, invitations, members, auditLogs, teams (leader/memberships/addedBy), incident reports (submitter/verifier), incidents (creator/verifier/coordinator), incident permissions, participant invitations, lead transfers, incident updates/notes, assignments, attachments, emergency requests/fulfillments. Better-auth maps `user` table.
- **Session**: id, expiresAt, token (unique), userId (Cascade), activeOrganizationId, indexes on userId and token. Better-auth `session` table.
- **Account / Verification**: better-auth standard tables; `account` has userId Cascade, indexes; `verification` has identifier index.
- **Organization**: id, name, slug (unique), logo, status (default "PENDING"), metadata, timestamps; index on status. Relations: members, invitations, applications, deletionRequests, approvedApplication (1:1), auditLogs, teams, incidents (lead/participations), lead transfers (from/to), updates/notes, emergency requests/fulfillments.
- **Member**: id, organizationId (Cascade), userId (Cascade), unique(organizationId, userId), role (default "member"), status (default "ACTIVE"), indexes on organizationId and userId. Better-auth `member` table (shared with org plugin).
- **Invitation**: id, organizationId (Cascade), email, role, status (default "pending"), expiresAt, inviterId (Cascade); indexes on organizationId and email. Better-auth `invitation` table.
- **OrganizationApplication**: id (cuid), applicantId (Restrict), organizationName, requestedSlug (indexed), organizationType, description, contactEmail, contactPhone, address, status (enum, default PENDING), reviewedById (SetNull), reviewedAt, reviewNotes, organizationId (SetNull), approvedOrganizationId (unique, SetNull); indexes on applicantId, [status, createdAt], requestedSlug.
- **OrganizationDeletionRequest**: id (cuid), organizationId (Restrict), requestedById (Restrict), reviewedById (SetNull), status (enum default PENDING), reason, reviewNotes, timestamps; indexes on [organizationId, status], requestedById, reviewedById.
- **AuditLog**: id (cuid), actorUserId (SetNull), actorType (enum default USER), actorNameSnapshot, organizationId (SetNull), action, entityType, entityId, before/after/metadata (Json), requestId, createdAt; indexes on [actorUserId, createdAt], [organizationId, createdAt], [entityType, entityId], [action, createdAt], requestId.
- **Team**: id (cuid), organizationId (Restrict), name, description, teamType (enum), status (default FORMING), leaderId (Restrict); indexes on [organizationId, status], leaderId. Relations: members, assignments.
- **TeamMember**: id (cuid), teamId (Restrict), userId (Restrict), role (enum default MEMBER), status (enum default ACTIVE), joinedAt, leftAt, addedById (SetNull); unique(teamId, userId); indexes on [userId, status], [teamId, status].
- **IncidentReport**: id (cuid), title, description, category, severity, source (default PUBLIC), submitterId (SetNull), location fields, status (default RECEIVED), verifiedById (SetNull), verifiedAt, rejectionReason, duplicateOfReportId (self-relation SetNull), incidentId (SetNull); indexes on [status, createdAt], [category, severity], submitterId, verifiedById, incidentId, duplicateOfReportId.
- **Incident**: id (cuid), incidentNumber (unique), title, description, category, severity, status (default OPEN), leadOrganizationId (Restrict), location fields, occurredAt, createdById (SetNull), coordinatorId (SetNull), verifiedById (SetNull), verifiedAt; indexes on [status, severity], category, [leadOrganizationId, status], createdById, coordinatorId, verifiedById, occurredAt. Relations: reports, participants, leadTransfers, updates, notes, assignments, attachments, emergencyRequests.
- **IncidentParticipant**: id (cuid), incidentId (Restrict), organizationId (Restrict), unique(incidentId, organizationId), status (default INVITED), invitedById/respondedById (SetNull), respondedAt, expiresAt, joinedAt, withdrawnAt; indexes on [organizationId, status], [incidentId, status], invitedById, respondedById, [status, expiresAt]. Relations: roles, permissions.
- **IncidentParticipantRole**: id (cuid), participantId (Restrict), role (enum); unique(participantId, role); index on role.
- **IncidentParticipantPermission**: id (cuid), participantId (Restrict), permission (enum), grantedById (SetNull), grantedAt, revokedAt; index on [participantId, permission], grantedById.
- **IncidentLeadTransfer**: id (cuid), incidentId (Restrict), fromOrganizationId (Restrict), toOrganizationId (Restrict), status (default REQUESTED), requestedById (Restrict), reviewedById (SetNull), reason, reviewNotes, timestamps/expiresAt; indexes on [incidentId, status], fromOrganizationId, toOrganizationId, requestedById.
- **IncidentUpdate**: id (cuid), incidentId (Restrict), organizationId (Restrict), authorId (Restrict), title?, content, visibility (default LEAD_ORGANIZATION); indexes on [incidentId, createdAt], [organizationId, createdAt], authorId, visibility.
- **IncidentNote**: id (cuid), incidentId (Restrict), organizationId (Restrict), authorId (Restrict), content; indexes on [incidentId, createdAt], [organizationId, createdAt], authorId.
- **IncidentAssignment**: id (cuid), incidentId (Restrict), teamId? (Restrict), assigneeUserId? (Restrict), createdById (Restrict), title, description, status (default PENDING), priority (default NORMAL), dueAt, acceptedAt, startedAt, completedAt; indexes on [incidentId, status], [teamId, status], [assigneeUserId, status], createdById. Comment: exactly one of teamId/assigneeUserId required.
- **IncidentAttachment**: id (cuid), incidentId (Restrict), uploadedById (Restrict), fileName, storageKey (unique), mimeType, fileSize (BigInt), visibility (default PRIVATE); indexes on [incidentId, createdAt], uploadedById, visibility.
- **EmergencyRequest**: id (cuid), requestNumber (unique), title, description, priority (default NORMAL), status (default OPEN), visibility (default NETWORK), requestingOrganizationId (Restrict), incidentId? (Restrict), createdById? (SetNull), location fields, neededBy, contact fields, closedAt, cancelledAt, cancellationReason; indexes on [requestingOrganizationId, status], incidentId, [status, priority], [visibility, status], createdById, neededBy. Relations: items, fulfillments.
- **EmergencyRequestItem**: id (cuid), requestId (Restrict), name, category, unit, notes, quantityRequested, quantityFulfilled (default 0), status (default OPEN); indexes on [requestId, status], category. Relation: fulfillments.
- **EmergencyRequestFulfillment**: id (cuid), requestId (Restrict), itemId (Restrict), organizationId (Restrict), status (default OFFERED), quantityOffered, quantityDelivered (default 0), notes, estimatedDeliveryAt, deliveredAt, offeredById/respondedById (SetNull), respondedAt, rejectionReason; indexes on [requestId, status], [itemId, status], [organizationId, status], offeredById, respondedById.

### CHECK / raw SQL constraints (migrations)

`prisma/migrations/20261122073459_init/migration.sql` appends raw SQL after the Prisma-generated portion:

1. Partial unique index `team_member_one_active_leader` on `team_member(teamId) WHERE role='LEADER' AND status='ACTIVE'`.
2. Partial unique index `incident_permission_one_active` on `incident_participant_permission(participantId, permission) WHERE revokedAt IS NULL`.
3. Partial unique index `incident_lead_transfer_one_active` on `incident_lead_transfer(incidentId) WHERE status IN ('REQUESTED','ACCEPTED')`.
4. `CHECK` constraint `incident_assignment_exactly_one_target`: exactly one of teamId/assigneeUserId is set.
5. `CHECK` `incident_report_verified_metadata_check`: VERIFIED status requires verifiedById AND verifiedAt.
6. `CHECK` `incident_report_duplicate_reference_check`: DUPLICATE status requires duplicateOfReportId.
7. `CHECK` `incident_report_no_self_duplicate`: duplicateOfReportId <> id.
8. Latitude/longitude range `CHECK`s on `incident_report` and `incident` (-90..90 / -180..180).
9. `CHECK` `incident_verified_metadata_pair`: verifiedById and verifiedAt are both null or both set on `incident`.
10. `CHECK` `incident_attachment_positive_file_size`: fileSize > 0.
11. Partial unique index `organization_deletion_one_pending` on `organization_deletion_request(organizationId) WHERE status='PENDING'`.

`prisma/migrations/20261125013717_add_emergency_requests/migration.sql` adds only tables/indexes/FKs — no CHECK constraints. The 20261124 migrations add enum values and columns only.

### Code-vs-schema mismatches

- Schema `Member.role` default is lowercase `"member"`; code treats roles as uppercase `OWNER`/`ADMIN`/`MEMBER` and uppercases on read. `admin-organization-application.ts:187` inserts `role: "owner"` (lowercase).
- `src/app/(dashboard)/incident-invitations/page.tsx:32` switches on `severity` with case `"MEDIUM"`; schema enum has `MODERATE`, so the `MEDIUM` branch is dead code (and `getSeverityStyle` falls to default for `MODERATE`).
- `IncidentAssignment` comment says a PostgreSQL CHECK enforces exactly-one-target; it exists only in raw migration SQL, not in Prisma schema (Prisma cannot express CHECK constraints).
- Emergency request models (M4) exist in schema and migrations but there are zero routes, actions, or components referencing `EmergencyRequest` anywhere in `src/` (grep found none).

---

## 5. THE CANONICAL PATTERNS

Each item shows one real excerpt with its file path.

### 5a. Server action (`src/app/actions/incidents.ts`)

Authorization outside try/catch (so Next.js redirects work), `safeParse` validation, discriminated union result shape, `$transaction` for incident + audit log, `revalidatePath` after success, generic catch, no P2002/P2034 handling here:

```ts
"use server";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { requireOrganizationPermission } from "@/lib/permissions/require-organization-permission";
import { createIncidentSchema } from "@/lib/validations/incident.schema";

type CreateIncidentResult =
  | { success: false; message: string; errors?: IncidentFieldErrors }
  | { success: true; message: string; incident: { id: string; incidentNumber: string; title: string; status: string } };

export async function createIncident(formData: unknown): Promise<CreateIncidentResult> {
  // Keep authorization outside try/catch so Next.js redirects work correctly.
  const context = await requireOrganizationPermission("CREATE_INCIDENT");

  try {
    const validation = createIncidentSchema.safeParse(formData);
    if (!validation.success) {
      return { success: false, message: "Please check the incident information.",
        errors: validation.error.flatten().fieldErrors };
    }
    const data = validation.data;
    const incidentNumber = `RG-${datePart}-${randomUUID().slice(0).toUpperCase()}`;

    const incident = await prisma.$transaction(async (tx) => {
      const createdIncident = await tx.incident.create({ ... data ..., status: "OPEN",
        leadOrganizationId: context.organizationId, createdById: context.session.user.id });
      await tx.auditLog.create({
        data: {
          actorUserId: context.session.user.id, actorType: "USER",
          actorNameSnapshot: context.session.user.name, organizationId: context.organizationId,
          action: "INCIDENT_CREATED", entityType: "Incident", entityId: createdIncident.id,
          after: { incidentNumber, title: createdIncident.title, category: data.category, ... },
        },
      });
      return createdIncident;
    });
    return { success: true, message: "Incident created successfully.", incident };
  } catch (error) {
    console.error("Incident creation failed:", error);
    return { success: false, message: "Something went wrong while creating the incident. Please try again." };
  }
}
```

P2002/P2034 handling exists only in `src/app/actions/incident-participants.ts:322-330` (and `P2034` at :595); all other actions use a generic catch.

### 5b. Zod schema file (`src/lib/validations/organization-application.schema.ts`)

`.trim()` on every string, field-specific messages, `.optional().or(z.literal(""))` for blankable fields, regex for slug, inferred type:

```ts
export const organizationApplicationSchema = z.object({
  organizationName: z.string().trim().min(2, "...").max(150, "..."),
  requestedSlug: z.string().trim().min(3, "...").max(60, "...")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens only"),
  description: z.string().trim().max(2000, "...").optional().or(z.literal("")),
  contactEmail: z.string().trim().email("...").max(254, "..."),
  contactPhone: z.string().trim().max(30, "...").optional().or(z.literal("")),
});

export type OrganizationApplicationFormValues = z.infer<typeof organizationApplicationSchema>;
```

Preprocess helpers appear in `incident.schema.ts` (`z.preprocess` for latitude/longitude/occurredAt) and `.transform((email) => email.toLowerCase())` in `organization-invitation.schema.ts:10`.

### 5c. Query file (`src/lib/incidents/queries.ts`)

Scope function, filter builder with allow-lists, fixed `take`, explicit select:

```ts
export function getOrganizationIncidentScope(organizationId: string): Prisma.IncidentWhereInput {
  return {
    OR: [
      { leadOrganizationId: organizationId },
      { participants: { some: { organizationId, status: "ACTIVE" } } },
    ],
  };
}

export async function getIncidents(organizationId, filters = {}) {
  return prisma.incident.findMany({
    where: buildIncidentFilters(organizationId, filters),
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, incidentNumber: true, title: true, category: true, severity: true,
      status: true, locationName: true, occurredAt: true, createdAt: true },
  });
}
```

`getIncidentById` scopes by `AND: [{ id }, getOrganizationIncidentScope(organizationId)]`. `getIncidentReports` (`lib/incidents/report-queries.ts`) uses `take: 100`, no organization scoping (admin-wide).

### 5d. List page — Server Component with `searchParams` as a Promise (`src/app/(dashboard)/incidents/page.tsx:12-23`)

```ts
interface IncidentsPageProps {
  searchParams: Promise<{ search?: string; status?: string; severity?: string }>;
}
export default async function IncidentsPage({ searchParams }: IncidentsPageProps) {
  const { organizationId, organization } = await requireOrganization();
  const params = await searchParams;
  ...
  const [incidents, stats] = await Promise.all([
    getIncidents(organizationId, filters), getIncidentStats(organizationId),
  ]);
}
```

Same pattern in `(admin)/admin/applications/page.tsx` and `(admin)/admin/incident-reports/page.tsx`.

### 5e. Client form — react-hook-form + zodResolver (`src/components/incidents/CreateIncidentForm.tsx`)

```ts
"use client";
import { toast } from "react-toastify";
import { useForm, type FieldPath, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createIncident } from "@/app/actions/incidents";
import { createIncidentSchema, type CreateIncidentFormValues } from "@/lib/validations/incident.schema";

const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } }
  = useForm<import("zod").input<typeof createIncidentSchema>, unknown, CreateIncidentFormValues>({
    resolver: zodResolver(createIncidentSchema), defaultValues: { title: "", description: "", category: "OTHER", severity: "MODERATE", ... },
  });

const onSubmit: SubmitHandler<CreateIncidentFormValues> = async (data) => {
  try {
    const result = await createIncident(data);
    if (result.success === false) {
      if (result.errors) { Object.entries(result.errors).forEach(([field, messages]) => {
        const message = messages?.[0]; if (message) { setError(field as FieldPath<...>, { type: "server", message }); } }); }
      toast.error(result.message);
      return;
    }
    toast.success(`${result.message} Incident number: ${result.incident.incidentNumber}`);
    reset();
  } catch { toast.error("Something went wrong. Please try again."); }
};
```

Flow: `handleSubmit(onSubmit)` → server action → field errors via `setError(..., { type: "server" })` → `toast.error` / `toast.success` → `reset()`. No `router.refresh()` or redirect (create page stays put). `OrganizationApplicationForm.tsx` differs: manual `safeParse` (no zodResolver), `router.push("/onboarding")`, no refresh.

### 5f. Client "manager" — useTransition + router.refresh (`src/components/incidents/IncidentCoordinatorManager.tsx`)

```ts
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { assignIncidentCoordinator } from "@/app/actions/incident-coordinator";

const [isPending, startTransition] = useTransition();

startTransition(async () => {
  const result = await assignIncidentCoordinator({ incidentId, coordinatorId: selectedCoordinatorId });
  if (!result.success) { toast.error(result.message); return; }
  toast.success(result.message);
  router.refresh();
});
```

Same pattern in `IncidentStatusSeverityManager.tsx`, `IncidentParticipantManager.tsx`, `IncidentInvitationActions.tsx`, `ApplicationReviewActions.tsx`. `router.refresh()` re-renders server components after mutation; no `revalidatePath` on the client (actions call `revalidatePath` server-side too).

### 5g. Audit log conventions (`src/app/actions/incident-status.ts:94-134`)

Action name format: `<ENTITY>_<EVENT>_<PAST TENSE>` (e.g. `INCIDENT_STATUS_UPDATED`, `INCIDENT_SEVERITY_UPDATED`, `INCIDENT_COORDINATOR_ASSIGNED`, `ORGANIZATION_APPLICATION_APPROVED`, `INCIDENT_REPORT_VERIFIED`, `INCIDENT_PARTICIPANT_INVITED`).

```ts
await tx.auditLog.create({
  data: {
    actorUserId: context.session.user.id,
    actorType: "USER",
    actorNameSnapshot: context.session.user.name,
    organizationId: context.organizationId,
    action: "INCIDENT_STATUS_UPDATED",
    entityType: "Incident",
    entityId: incident.id,
    before: { status: incident.status },
    after: { status },
    metadata: { incidentNumber: incident.incidentNumber, incidentTitle: incident.title },
  },
});
```

Conventions: `actorType` from `AuditActorType` (USER/SYSTEM); `entityType` is the model name ("Incident", "IncidentReport", "OrganizationApplication", "IncidentParticipant"); `before`/`after` hold snapshots of changed fields; `metadata` holds context (numbers, titles) never in before/after; always created inside the same `$transaction` as the mutation. `entityType` values used in code: Incident, IncidentReport, OrganizationApplication, IncidentParticipant (not constrained by enum — plain String column).

---

## 6. UI CONVENTIONS

### Design tokens (`src/app/globals.css`)

Defined via `@theme inline`:
`--color-background` (#f8fafc light / #101820 dark), `--color-foreground`, `--color-surface`, `--color-surface-secondary`, `--color-border`, `--color-primary` (#101820 / #f8fafc), `--color-primary-foreground`, `--color-emergency` (#f97316 / #fb923c), `--color-success` (#16a34a / #22c55e), `--color-critical` (#dc2626 / #ef4444), `--color-info` (#2563eb / #60a5fa), `--color-muted` (#64748b / #94a3b8), `--font-sans`, `--font-mono`.

Tailwind class names actually used for tokens: `bg-background`, `bg-surface`, `bg-surface-secondary`, `border-border`, `bg-primary`, `text-primary`, `bg-emergency/10`, `text-emergency`, `bg-critical/10`, `text-critical`, `bg-success/10`, `text-success`, `bg-info/5` (dashboard info banner), `text-muted`, `bg-muted/10`, `bg-muted/5`.

### Classes used but NOT defined as tokens

- `bg-card` — used in `src/app/(dashboard)/incident-invitations/page.tsx:79,91,113`; not in globals.css.
- `text-muted-foreground` — used in `src/app/invitations/accept/page.tsx:109` and `src/components/organization/InvitationAcceptanceCard.tsx`; not in globals.css.
- `bg-warning` / `text-warning` — `src/components/incidents/IncidentStats.tsx:27-28,33` and `IncidentStatusBadge.tsx:8,12`; not defined.
- `bg-danger` / `text-danger` — `IncidentStats.tsx:34-35`, `IncidentStatusBadge.tsx:9`; not defined.
- `bg-success` / `text-success` — `IncidentStats.tsx:41-42`; not defined (though `--color-success` exists, the token class is `text-success`/`bg-success` which resolve only if Tailwind maps them — they do NOT map to `--color-success`; these are arbitrary/undefined classes).
- Primary color hardcoded as `#101D35` in many places (onboarding, landing, auth shell) instead of the `primary` token (#101820).

### Shared class strings

- Input: `w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10` (incidents form); auth form uses its own `inputClass` with `border-slate-200`/`focus:border-emerald-500` (slate/emerald hardcoding, not tokens).
- Label: `mb-1.5 block text-sm font-medium` (incidents) / `mb-2 block text-sm font-semibold text-slate-700` (auth).
- Error: `mt-1 text-xs text-red-500` (incidents), `mt-1.5 text-xs font-medium text-red-500` (auth).
- Card: `rounded-xl border border-border bg-surface p-5` (dashboard/incidents), `rounded-2xl border border-border bg-surface shadow-sm` (admin).
- Button: `rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90`; disabled: `disabled:cursor-not-allowed disabled:opacity-50`.
- Badge: `inline-flex rounded-full px-2.5 py-1 text-xs font-medium ...` with `bg-muted/10 text-muted` fallback.

### Sidebar navigation

`src/components/layout/dashboard-sidebar.tsx` defines `navigationGroups` with links: Dashboard (`/dashboard`), Home (`/`), Emergency Operations group — Incidents (`/incidents`), Incident Invitations (`/incident-invitations`), Emergency Requests (`/requests`), Resources (`/resources`), Allocations (`/allocations`), Shelters (`/shelters`), People & Coordination — Volunteers (`/volunteers`), Teams (`/teams`), Intelligence — Live Map (`/map`), Reports (`/reports`), Settings (`/settings`), Members (`/settings/members`).

Routes that exist vs linked-but-missing:
- Exist: `/dashboard`, `/incidents`, `/incidents/create`, `/incidents/[incidentId]`, `/incident-invitations`, `/settings`, `/settings/members`, `/`.
- Linked but NO route file: `/requests`, `/resources`, `/allocations`, `/shelters`, `/volunteers`, `/teams`, `/map`, `/reports`. These sidebar items are dead links (NOT STARTED features).

`src/components/admin/AdminSidebar.tsx` links `/admin`, `/admin/applications`, `/admin/organizations`, `/admin/incident-reports`, `/admin/users`, `/admin/audit-logs`, `/admin/settings` — only `/admin`, `/admin/applications`, `/admin/incident-reports` exist.

### Theme and toast providers

`src/app/layout.tsx` (Server root layout): wraps children in `ThemeProvider` from `@teispace/next-themes` with `attribute="class" defaultTheme="light" enableSystem={false}`, then `<ToastProvider />`. `src/components/providers/theme-provider.tsx` is a thin re-export wrapper. `src/components/providers/ToastProvider.tsx` renders `react-toastify` `ToastContainer` (position top-right, autoClose 3000, theme light). Theme toggle: `src/components/ui/theme-toggle.tsx` uses `useTheme()` and toggles light/dark.

---

## 7. FEATURE STATUS BY MILESTONE

| Feature | Status | Implementing file paths |
|---|---|---|
| Auth (login, register, session, email/password, auth continue redirect) | DONE | `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/lib/auth/session.ts`, `src/app/api/auth/[...all]/route.ts`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/auth/continue/page.tsx`, `src/components/auth/AuthForm.tsx`, `AuthShell.tsx`, `Loginform.tsx` (empty), `RegisterForm.tsx` (empty) |
| Organization onboarding & applications (apply, status, review, approve → org created, applicant as OWNER) | DONE | `src/app/onboarding/page.tsx`, `src/app/onboarding/organization/page.tsx`, `src/components/organization/OrganizationApplicationForm.tsx`, `src/components/onboarding/{AccountInformation,ApplicationStatusCard,OnboardingHeader,OnboardingOptions}.tsx`, `src/app/actions/organization-application.ts`, `src/app/actions/admin-organization-application.ts`, validations `organization-application.schema.ts`, `organization-application-review.schema.ts` |
| Admin application review | DONE | `src/app/(admin)/admin/applications/page.tsx`, `[applicationId]/page.tsx`, `src/components/admin/applications/{ApplicationTable,ApplicationStatusBadge,details/*}.tsx`, `src/app/actions/admin-organization-application.ts` |
| Incident reports — public submission | NOT STARTED | Schema `IncidentReport` exists; no public submission page or action found |
| Incident reports — admin review | DONE | `src/app/(admin)/admin/incident-reports/page.tsx`, `[reportId]/page.tsx`, `src/lib/incidents/report-queries.ts`, `src/app/actions/admin-incident-report.ts`, `src/components/admin/incident-reports/*` |
| Incidents — list | DONE | `src/app/(dashboard)/incidents/page.tsx`, `src/lib/incidents/queries.ts`, `src/components/incidents/{IncidentTable,IncidentFilters,IncidentStats}.tsx` |
| Incidents — create | DONE | `src/app/(dashboard)/incidents/create/page.tsx`, `src/app/actions/incidents.ts`, `src/components/incidents/CreateIncidentForm.tsx`, `src/lib/validations/incident.schema.ts` |
| Incidents — details | DONE | `src/app/(dashboard)/incidents/[incidentId]/page.tsx` |
| Incidents — coordinator | DONE | `src/app/actions/incident-coordinator.ts`, `src/components/incidents/IncidentCoordinatorManager.tsx` |
| Incidents — status | DONE | `src/app/actions/incident-status.ts`, `src/components/incidents/IncidentStatusSeverityManager.tsx`, `src/lib/validations/incident-status.schema.ts` |
| Incidents — severity | DONE | `src/app/actions/incident-severity.ts`, `src/lib/validations/incident-severity.schema.ts` |
| Incidents — participants | DONE | `src/app/actions/incident-participants.ts`, `src/components/incidents/IncidentParticipantManager.tsx`, `src/lib/incidents/queries.ts` (`getIncidentParticipants`, `getIncomingIncidentInvitations`) |
| Incidents — invitations (respond) | DONE | `src/app/(dashboard)/incident-invitations/page.tsx`, `src/components/incidents/IncidentInvitationActions.tsx`, `acceptIncidentInvitation`/`rejectIncidentInvitation` in `incident-participants.ts` |
| Dashboard | PARTIAL | `src/app/(dashboard)/dashboard/page.tsx` + `loading.tsx`, `src/features/dashboard/*` — all illustrative/demo data (`dashboard-data.ts`), not connected to Prisma; skeleton present |
| Emergency requests (M4) | NOT STARTED | Schema + migration exist (`prisma/schema.prisma` M4 section, `20261125013717_add_emergency_requests`); zero routes/actions/components reference `EmergencyRequest`; sidebar links `/requests` which has no route |

### Every route under src/app

| Route | File | Component type |
|---|---|---|
| / | src/app/page.tsx | Server |
| /login | src/app/(auth)/login/page.tsx | Server |
| /register | src/app/(auth)/register/page.tsx | Server |
| /auth/continue | src/app/auth/continue/page.tsx | Server |
| /api/auth/[...all] | src/app/api/auth/[...all]/route.ts | Route handler (Server) |
| /onboarding | src/app/onboarding/page.tsx | Server |
| /onboarding/organization | src/app/onboarding/organization/page.tsx | Server |
| /invitations/accept | src/app/invitations/accept/page.tsx | Server |
| /admin | src/app/(admin)/layout.tsx + admin/page.tsx | Server |
| /admin/applications | src/app/(admin)/admin/applications/page.tsx | Server |
| /admin/applications/[applicationId] | src/app/(admin)/admin/applications/[applicationId]/page.tsx | Server |
| /admin/incident-reports | src/app/(admin)/admin/incident-reports/page.tsx | Server |
| /admin/incident-reports/[reportId] | src/app/(admin)/admin/incident-reports/[reportId]/page.tsx | Server |
| /dashboard | src/app/(dashboard)/layout.tsx + dashboard/page.tsx | Server |
| /incidents | src/app/(dashboard)/incidents/page.tsx | Server |
| /incidents/create | src/app/(dashboard)/incidents/create/page.tsx | Server |
| /incidents/[incidentId] | src/app/(dashboard)/incidents/[incidentId]/page.tsx | Server |
| /incident-invitations | src/app/(dashboard)/incident-invitations/page.tsx | Server |
| /settings | src/app/(dashboard)/settings/page.tsx | Server |
| /settings/members | src/app/(dashboard)/settings/members/page.tsx | Server |

Server actions (not routes): `src/app/actions/*.ts` (11 files, all `"use server"`).

### TODO / FIXME / HACK comments

None found (case-insensitive search over `src/`). The single grep hit in `OrganizationApplicationForm.tsx:243` is a placeholder phone number (`+880 1XXX XXXXXX`), not a task marker. There is a temporary debug `console.log("INVITATION PAGE SESSION:", ...)` in `src/app/invitations/accept/page.tsx:54`.

---

## 8. TESTS

Test files (4), all under `src/lib/permissions/`, run with `vitest run` (`vitest.config.mts`: include `src/**/*.test.ts`, node environment, `@` alias to `src`, `clearMocks: true`):

- `organization.test.ts` — `requireOrganization` (auth allow, redirect when no org, inactive org, no active membership); mocks `requireAuth`, `prisma.organization.findFirst`, `redirect`.
- `require-organization-permission.test.ts` — allow/deny per role for DELETE_ORGANIZATION, MANAGE_MEMBERS, VIEW_ORGANIZATION, TRANSFER_OWNERSHIP; mocks `requireOrganization` and `redirect`.
- `organization-permissions.test.ts` — `hasOrganizationPermission` matrix for all roles + unknown roles.
- `organization-role.test.ts` — `requireOrganizationRole` allow/redirect + uppercase normalization.

Test run result: **4 test files passed, 28 tests passed, 2.38s** (`npm test`, vitest 4.1.12). Prisma and auth are mocked with `vi.mock`; no real database is used. No tests for server actions, pages, components, or queries.

---

## 9. KNOWN PROBLEMS

1. **`src/app/(dashboard)/incident-invitations/page.tsx:32`** — `case "MEDIUM":` in `getSeverityStyle`, but the schema enum is `MODERATE`; the `MEDIUM` branch is dead and `MODERATE` falls through to the default style.
2. **`src/app/(dashboard)/incident-invitations/page.tsx:79,91,113`** — uses `bg-card`, which is not defined as a Tailwind token in `globals.css` (undefined class).
3. **`src/app/invitations/accept/page.tsx:109`** and **`src/components/organization/InvitationAcceptanceCard.tsx:77`** — use `text-muted-foreground` / `bg-card`, undefined tokens; `bg-card` also appears at InvitationAcceptanceCard:77.
4. **`src/components/incidents/IncidentStats.tsx:27-44`** — uses `bg-warning`, `text-warning`, `bg-danger`, `text-danger`, `bg-success`, `text-success`; none are defined tokens (hardcoded color names that resolve to nothing in this Tailwind setup).
5. **`src/components/incidents/IncidentStatusBadge.tsx:8,12`** — uses `bg-warning`/`text-warning`/`bg-danger`/`text-danger`, undefined.
6. **`src/components/auth/Loginform.tsx` and `RegisterForm.tsx`** — 0-byte dead files; unused (`AuthForm.tsx` handles both modes).
7. **`src/components/organization/OrganizationApplicationForm.tsx`** — only form that validates manually without `zodResolver`, and the only form that `router.push`es without `router.refresh()`; inconsistent with `CreateIncidentForm.tsx` and manager components.
8. **`src/components/organization/OrganizationInvitationForm.tsx`** — uncontrolled state, no react-hook-form/zod, unlike every other form.
9. **`src/app/actions/incident-status.ts`, `incident-severity.ts`, `incident-coordinator.ts`** — catch blocks do not handle Prisma `P2002`/`P2034` (only `incident-participants.ts` does); concurrent unique-constraint conflicts return a generic error.
10. **`src/lib/incidents/queries.ts`** — `getIncidents` hardcodes `take: 50` with no cursor-based pagination.
11. **`src/lib/incidents/report-queries.ts`** — `getIncidentReports` has no organization scoping (admin-only page, but nothing enforces that at the query level).
12. **`src/app/(dashboard)/incident-invitations/page.tsx:39`** — default `bg-muted/10 text-muted`; `bg-muted/10` relies on the `muted` token (defined) but opacity on CSS-variable colors is a Tailwind v4 behavior.
13. **Dashboard data (`src/features/dashboard/data/dashboard-data.ts`)** — uses severities `Critical/High/Medium/Low` and statuses `Responding/Investigating/Reported/Resolved` that do not match the `IncidentSeverity`/`IncidentStatus` enums; purely illustrative, labeled "Demo dashboard".
14. **Hardcoded `#101D35` primary** across onboarding/landing/auth components instead of the `primary` token; dark-mode variants hardcode `dark:bg-gray-950`/`dark:bg-gray-900` etc. instead of `surface`/`background` tokens.
15. **Sidebar/admin navigation link to nonexistent routes**: `/requests`, `/resources`, `/allocations`, `/shelters`, `/volunteers`, `/teams`, `/map`, `/reports`, `/admin/organizations`, `/admin/users`, `/admin/audit-logs`, `/admin/settings` — clicking them produces 404.
16. **`src/lib/utils`, `src/components/shared`, `src/hooks`, `src/services`, `src/store`, `src/types`, and feature folders except `dashboard` are empty** — convention vacuum; new code has no guided placement.

---

## 10. OPEN QUESTIONS

1. Is `@teispace/next-themes` intentional (unusual package name), or a typo for `next-themes`? It is imported by `theme-provider.tsx` and `theme-toggle.tsx`.
2. Where should public incident-report submission live (route + action)? Schema supports it (`IncidentReport.source = PUBLIC`) but nothing exists.
3. Are emergency requests (M4) intended to be built next? Schema/migrations exist but no UI/actions; sidebar already links `/requests`.
4. Should `Member.role` be normalized to uppercase in the schema/default to match the TypeScript `OrganizationRole` type, or should code stop uppercasing?
5. Should `bg-card`, `text-muted-foreground`, `bg-warning`, `text-danger`, `bg-success` be added to `globals.css` tokens, or replaced with defined tokens?
6. Is `DATABASE_URL_POOLED` (used by Prisma) intentionally separate from `DATABASE_URL` (used by `prisma.config.ts`) for pooled vs direct connections?
7. How is `SYSTEM_ADMIN` `systemRole` provisioned in production — via `scripts/promote-system-admin.ts` directly against the DB?
8. Are empty folders (`src/hooks`, `src/services`, `src/store`, `src/types`, `src/lib/utils`, unused feature folders) to be removed or filled?

---

## AUDIT METHOD NOTE

All statements above were verified by reading the listed files in `D:\L!-Project 5\reliefgrid`. `src/generated`, `node_modules`, `.next`, and `prisma/migrations` contents were not included as excerpts. `.env` values were read only to confirm variable names and are not reproduced here. Tests were run with `npm test` only; no migrations, installs, or builds were executed.