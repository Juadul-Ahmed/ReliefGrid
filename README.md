# ReliefGrid

### Multi-Tenant Emergency Response & Resource Coordination Platform

ReliefGrid is a web-based operational response platform designed to help organizations coordinate emergency incidents, manage resources, track inventory, and organize response activities through a centralized system.

It provides organization-based collaboration, role-based access control, incident management, resource allocation, inventory tracking, delivery coordination, operational mapping, and platform-level administration.

**Live Application:** [https://relief-grid-m7nb.vercel.app/](https://relief-grid-m7nb.vercel.app/)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [User Roles & Permissions](#user-roles--permissions)
- [Core Modules](#core-modules)
- [Database & Multi-Tenancy](#database--multi-tenancy)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Commands](#available-commands)
- [Testing & Code Quality](#testing--code-quality)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [Author](#author)

---

## Overview

Emergency response operations often involve multiple organizations, changing incident conditions, limited resources, and complex coordination requirements.

ReliefGrid aims to simplify these operations by providing a shared platform where authorized organizations can manage incidents, coordinate participants, monitor available resources, and track the movement of supplies.

The platform follows a multi-tenant architecture, allowing multiple organizations to operate independently while supporting controlled collaboration when responding to incidents.

### Core Objectives

- Centralize emergency incident reporting and management.
- Enable collaboration between participating organizations.
- Improve visibility into available resources and inventory.
- Coordinate emergency requests, allocations, dispatches, and deliveries.
- Provide operational insights through dashboards and reports.
- Maintain accountability through role-based permissions and audit logging.

---

## Key Features

### Organization Management

- Organization onboarding and management.
- Organization membership management.
- Invitation-based collaboration.
- Organization-specific roles and permissions.
- Organization switching and context management.

### Incident Management

- Incident creation and reporting.
- Incident listing, search, and filtering.
- Incident details and status management.
- Severity classification.
- Administrative incident review and verification.
- Coordinator assignment.
- Incident participant management.
- Cross-organization participation and invitations.

### Resource Management

- Resource registration and management.
- Resource availability tracking.
- Organization-scoped resource operations.
- Resource allocation and coordination.

### Inventory Management

- Inventory initialization and management.
- Batch-based inventory tracking.
- Expiry-date management.
- FEFO (First Expired, First Out) batch selection.
- Expired-batch exclusion during allocation.
- Partial inventory allocation and dispatch support.

### Emergency Requests & Allocations

- Emergency resource requests.
- Request management and tracking.
- Resource allocation workflows.
- Allocation status transitions.
- Partial dispatch handling.

### Delivery & Fulfillment

- Dispatch coordination.
- Delivery tracking and fulfillment workflows.
- Operational status management.

### Operational Map

- Interactive map-based operational visualization.
- Geographic representation of relevant operational resources and locations.
- Location-oriented operational awareness.

### Reports & Analytics

- Operational reporting.
- Dashboard metrics and KPIs.
- Date-range-based reporting.
- Visual data representation and charts.

### Audit Logging

- Platform activity records.
- Administrative action tracking.
- Audit log filtering and inspection.
- Read-only audit history.

### System Administration

- Platform administration dashboard.
- Organization administration.
- User management.
- User blocking and unblocking.
- Administrative account controls.
- Platform configuration and settings.

### Public Experience

- Public landing page.
- About and contact pages.
- Public incident reporting.
- Authentication-aware navigation and calls to action.

---

## Technology Stack

ReliefGrid uses a modern full-stack TypeScript architecture.

| Category | Technology |
|---|---|
| Framework | Next.js 16 |
| Frontend Library | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Component System | HeroUI v3 |
| Database | PostgreSQL |
| Database Hosting | Neon |
| ORM | Prisma 7 |
| PostgreSQL Adapter | `@prisma/adapter-pg` |
| Authentication | Better Auth |
| Validation | Zod |
| Charts | Recharts |
| Mapping | Leaflet |
| Testing | Vitest |
| Deployment | Vercel |
| Version Control | Git & GitHub |

The project also uses supporting libraries for icons, forms, state management, database operations, and application utilities.

---

## Architecture

ReliefGrid follows a modular Next.js App Router architecture.

### Application Architecture

```text
Client Browser
      |
      v
Next.js App Router
      |
      +----------------------+
      |                      |
      v                      v
Server Components       Client Components
      |                      |
      v                      v
Server Actions          Interactive UI
      |
      v
Business Logic & Permissions
      |
      v
Prisma ORM
      |
      v
PostgreSQL (Neon)
```

### Main Architectural Principles

**1. Multi-Tenant Architecture**

Organizations operate within isolated data boundaries. Organization-specific operations are scoped to the authenticated user's active organization and authorized membership.

**2. Role-Based Access Control**

The platform distinguishes between platform administrators and organization-level users.

**3. Server-Side Authorization**

Sensitive operations enforce authentication and permission checks on the server rather than relying only on frontend visibility.

**4. Modular Code Organization**

Features are separated into routes, components, server actions, validation schemas, and shared business logic.

**5. Database-Centered Data Management**

Prisma provides typed database access and manages the PostgreSQL data model and migrations.

---

## User Roles & Permissions

ReliefGrid has two authorization levels.

### Platform-Level Role

| Role | Responsibility |
|---|---|
| `SYSTEM_ADMIN` | Manages platform-level operations, users, organizations, audit logs, and platform settings. |

### Organization-Level Roles

| Role | Responsibility |
|---|---|
| `OWNER` | Organization ownership and administrative control. |
| `ADMIN` | Organization management and authorized operational administration. |
| `MEMBER` | Participates in organization activities according to assigned permissions. |

**Important:** `SYSTEM_ADMIN` is a platform-level role. `ADMIN` is an organization-level role. They are not interchangeable.

Access to organization data and operations is governed by membership, organization context, and permission checks.

---

## Core Modules

The application is organized around several major functional areas.

| Module | Purpose |
|---|---|
| Authentication | Account authentication and session management. |
| Organizations | Organization onboarding, membership, and invitations. |
| Incidents | Incident reporting, review, assignment, and participation. |
| Resources | Resource registration and management. |
| Inventory | Stock, batches, expiry, and availability tracking. |
| Emergency Requests | Requests for operational resources. |
| Allocations | Resource allocation and dispatch workflows. |
| Deliveries | Delivery and fulfillment coordination. |
| Operational Map | Geographic operational visualization. |
| Reports | Operational analytics and reporting. |
| Audit Logs | Administrative activity history. |
| System Administration | Platform-wide administration and configuration. |

---

## Database & Multi-Tenancy

ReliefGrid uses PostgreSQL hosted on Neon, with Prisma as its ORM.

The database schema supports the application's main operational domains, including:

- User accounts and authentication.
- Organizations and memberships.
- Organization invitations.
- Incidents and incident participation.
- Resources and inventory.
- Inventory batches and expiration.
- Emergency requests and allocations.
- Dispatch and delivery workflows.
- Audit logs.
- Platform settings.

### Database Connection Strategy

The application uses separate connection configurations for different purposes:

- `DATABASE_URL`: Direct database connection, primarily used for migrations.
- `DATABASE_URL_POOLED`: Pooled database connection for application runtime.

Prisma Client is generated into the project's custom generated-client directory before production compilation.

---

## Project Structure

The following is a simplified overview of the application architecture.

```text
reliefgrid/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   ├── (admin)/
│   │   ├── actions/
│   │   ├── about/
│   │   ├── contact/
│   │   ├── onboarding/
│   │   ├── report-incident/
│   │   └── api/
│   │
│   ├── components/
│   ├── features/
│   ├── hooks/
│   │
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── permissions/
│   │   ├── inventory/
│   │   └── ...
│   │
│   └── generated/
│       └── prisma/
│
├── tests/
│
├── prisma.config.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── vercel.json
└── README.md
```

*Note: Generated Prisma Client files are created during installation/build workflows and are not committed to the repository.*

---

## Getting Started

Follow these instructions to run ReliefGrid locally.

### Prerequisites

Make sure you have installed:

- Node.js (compatible with the project's Next.js version).
- npm.
- Git.
- A PostgreSQL database, such as Neon.
- A Better Auth secret.

### 1. Clone the Repository

```bash
git clone https://github.com/Juadul-Ahmed/ReliefGrid.git

cd ReliefGrid
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL="your_direct_postgresql_connection_string"

DATABASE_URL_POOLED="your_pooled_postgresql_connection_string"

BETTER_AUTH_SECRET="your_secure_auth_secret"

BETTER_AUTH_URL="http://localhost:3000"
```

Add any additional variables required by optional integrations configured in your local environment.

Never commit your `.env` file.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Apply Database Migrations

For local development:

```bash
npx prisma migrate dev
```

This applies pending development migrations to your configured database.

### 6. Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Direct PostgreSQL database connection. |
| `DATABASE_URL_POOLED` | Pooled PostgreSQL connection for application runtime. |
| `BETTER_AUTH_SECRET` | Secret used by Better Auth. |
| `BETTER_AUTH_URL` | Base URL of the application. |

Additional integration-specific variables may be required depending on enabled services and deployment configuration.

Use actual credentials from your own development or production environment. Never publish secret values.

---

## Available Commands

Common project commands:

| Command | Description |
|---|---|
| `npm install` | Install dependencies. |
| `npm run dev` | Start development server. |
| `npx prisma generate` | Generate Prisma Client. |
| `npx prisma migrate dev` | Apply development database migrations. |
| `npx prisma migrate deploy` | Apply pending migrations in deployment environments. |
| `npm run build` | Generate Prisma Client and build the production application. |
| `npx vitest run` | Execute automated tests. |
| `npx tsc --noEmit` | Run TypeScript validation. |
| `npx eslint .` | Run ESLint, subject to the project's configuration. |

Check `package.json` for the complete and authoritative list of project scripts.

---

## Testing & Code Quality

ReliefGrid uses Vitest for automated testing.

The test suite covers application logic and important operational workflows, including permissions, data access, and feature-specific behavior.

### Latest Verification Results

| Check | Result |
|---|---|
| TypeScript | Passed |
| ESLint | 0 errors; 3 warnings |
| Automated tests | 466 passed |
| Test files | 34 passed |
| Production build | Passed |

These results represent the latest reported verification run and may change as the project evolves.

Run the test suite:

```bash
npx vitest run
```

Run TypeScript validation:

```bash
npx tsc --noEmit
```

---

## Deployment

ReliefGrid is deployed using Vercel and connected to GitHub.

**Production URL:** [https://relief-grid-m7nb.vercel.app/](https://relief-grid-m7nb.vercel.app/)

### Production Build

The project generates Prisma Client before building Next.js:

```bash
prisma generate && next build
```

The build script is configured in `package.json`, with additional Vercel configuration in `vercel.json`.

### Production Environment

Configure the following environment variables in Vercel:

```text
DATABASE_URL
DATABASE_URL_POOLED
BETTER_AUTH_SECRET
BETTER_AUTH_URL
```

For production:

- Use the production Neon database.
- Configure the pooled connection for application runtime.
- Set `BETTER_AUTH_URL` to the actual production domain.
- Keep authentication secrets private.

### Production Database Migrations

Run production migrations separately from the build process:

```bash
npx prisma migrate deploy
```

Make sure the database connection targets the intended production database before running this command.

---

## Security Considerations

Security is an important part of ReliefGrid's architecture.

Key considerations include:

- Server-side authentication and authorization.
- Organization-level permission enforcement.
- Tenant-scoped data access.
- Separation of platform and organization administration.
- Input validation using Zod.
- Controlled organization invitations and membership.
- Audit logging for administrative operations.
- Protected database credentials and environment variables.

Frontend visibility alone is never a substitute for server-side permission enforcement.

---

## Future Improvements

Potential areas for continued development include:

- Expanded operational analytics.
- More advanced incident coordination workflows.
- Additional automation and notification capabilities.
- Improved resource forecasting and reporting.
- Expanded integration capabilities.
- Further security and performance optimization.

These are potential improvement areas, not claims of already implemented functionality.

---

## Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Run the relevant tests and quality checks.
5. Submit a pull request with a clear description of your changes.

Please avoid committing environment files, credentials, generated secrets, or other sensitive information.

---

## Author

Juadul Ahmed Bhuiyan  
Sichuan University  
Software Engineering Student

---

**Built with Next.js, TypeScript, PostgreSQL, and Prisma.**

**ReliefGrid — Coordinating resources. Connecting organizations. Supporting emergency response.**
