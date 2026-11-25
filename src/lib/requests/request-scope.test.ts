import { describe, expect, it, vi } from "vitest";

// The query builders import the Prisma client, which requires a live
// DATABASE_URL_POOLED at module load. Mock it so these pure scope tests can run
// without a database.
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));

import { getOrganizationIncidentScope } from "@/lib/incidents/queries";
import { getEmergencyRequestScope } from "./queries";

type Clause = Record<string, unknown>;

interface ParticipantClause {
  participants: { some: { organizationId: string; status: string } };
}

interface IncidentScope {
  OR: Clause[];
}

function asClauses(value: unknown): Clause[] {
  return value as Clause[];
}

describe("getOrganizationIncidentScope", () => {
  it("matches the lead organization", () => {
    const scope = getOrganizationIncidentScope("org-1");
    const clauses = asClauses(scope.OR);

    expect(clauses).toEqual([
      { leadOrganizationId: "org-1" },
      {
        participants: {
          some: { organizationId: "org-1", status: "ACTIVE" },
        },
      },
    ]);
  });

  it("requires participant status ACTIVE (excludes rejected/withdrawn)", () => {
    const scope = getOrganizationIncidentScope("org-1");
    const participantClause = asClauses(scope.OR)[1] as unknown as ParticipantClause;

    expect(participantClause.participants.some.status).toBe("ACTIVE");
  });
});

describe("getEmergencyRequestScope", () => {
  it("scopes to own organization OR linked incident scope", () => {
    const scope = getEmergencyRequestScope("org-1");
    const clauses = asClauses(scope.OR);

    expect(clauses).toHaveLength(2);
    expect(clauses[0]).toEqual({ organizationId: "org-1" });
    expect(clauses[1]).toEqual({
      incident: getOrganizationIncidentScope("org-1"),
    });
  });

  it("does not grant standalone requests to other organizations", () => {
    // A standalone request has incidentId = null, so it can only satisfy the
    // first clause ({ organizationId }). The second clause requires an incident
    // relation and therefore cannot match a null incident.
    const scope = getEmergencyRequestScope("org-1");
    const clauses = asClauses(scope.OR);

    expect(clauses[0]).toEqual({ organizationId: "org-1" });
    expect(clauses[1]).toHaveProperty("incident");
    expect(clauses[1]).not.toHaveProperty("organizationId");
  });

  it("introduces no NETWORK visibility", () => {
    const serialized = JSON.stringify(getEmergencyRequestScope("org-1"));

    expect(serialized).not.toContain("NETWORK");
    expect(serialized).not.toContain("network");
  });

  it("grants incident-linked visibility only via lead or ACTIVE participation", () => {
    const scope = getEmergencyRequestScope("org-1");
    const incidentScope = asClauses(scope.OR)[1].incident as IncidentScope;

    expect(incidentScope.OR[0]).toEqual({ leadOrganizationId: "org-1" });
    expect(incidentScope.OR[1].participants).toEqual({
      some: { organizationId: "org-1", status: "ACTIVE" },
    });
  });
});