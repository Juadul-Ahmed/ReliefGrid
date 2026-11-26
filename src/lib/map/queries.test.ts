import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getShelters: vi.fn(),
  getResources: vi.fn(),
  getOrganizationIncidentScope: vi.fn(),
  hasOrganizationPermission: vi.fn(),
  prisma: {
    incident: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/shelters/queries", () => ({
  getShelters: mocks.getShelters,
  deriveDisplayStatus: vi.fn((shelter) =>
    shelter.status === "ACTIVE" &&
    shelter.currentOccupancy >= shelter.capacity
      ? "FULL"
      : shelter.status,
  ),
}));

vi.mock("@/lib/resources/queries", () => ({
  getResources: mocks.getResources,
}));

vi.mock("@/lib/incidents/queries", () => ({
  getOrganizationIncidentScope: mocks.getOrganizationIncidentScope,
}));

vi.mock("@/lib/permissions/organization-permissions", () => ({
  hasOrganizationPermission: mocks.hasOrganizationPermission,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: mocks.prisma,
}));

import { getOperationalMapData } from "./queries";

const ORG = "org-1";
const ROLE_OWNER = "OWNER";
const ROLE_MEMBER = "MEMBER";

const shelterWithCoords = {
  id: "shelter-1",
  name: "North Shelter",
  address: "100 Main St",
  latitude: 45.5,
  longitude: -122.7,
  capacity: 100,
  currentOccupancy: 100,
  status: "ACTIVE",
  displayStatus: "FULL",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const shelterWithoutCoords = {
  ...shelterWithCoords,
  id: "shelter-2",
  name: "South Shelter",
  latitude: null,
  longitude: null,
  currentOccupancy: 50,
};

const incidentWithCoords = {
  id: "incident-1",
  incidentNumber: "INC-001",
  title: "Fire at warehouse",
  category: "FIRE",
  severity: "HIGH",
  status: "ACTIVE",
  locationName: "Warehouse",
  address: "200 Industrial Ave",
  latitude: 40.0,
  longitude: -74.0,
};

const incidentWithoutCoords = {
  ...incidentWithCoords,
  id: "incident-2",
  title: "Flood downtown",
  latitude: null,
  longitude: null,
};

const resourceWithCoords = {
  id: "resource-1",
  name: "Bottled Water",
  category: "DRINKING_WATER",
  unit: "liters",
  locationName: "Central Warehouse",
  address: "300 Depot Rd",
  latitude: 34.0,
  longitude: -118.0,
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const resourceWithoutCoords = {
  ...resourceWithCoords,
  id: "resource-2",
  name: "Blankets",
  latitude: null,
  longitude: null,
};

function setupMocks() {
  vi.clearAllMocks();
  mocks.hasOrganizationPermission.mockImplementation((r, p) => {
    if (r === "OWNER" || r === "ADMIN") return true;
    if (r === "MEMBER") {
      return p === "VIEW_SHELTERS" || p === "VIEW_RESOURCES";
    }
    return false;
  });
  mocks.getOrganizationIncidentScope.mockReturnValue({
    OR: [
      { leadOrganizationId: ORG },
      {
        participants: {
          some: { organizationId: ORG, status: "ACTIVE" },
        },
      },
    ],
  });
}

describe("getOperationalMapData", () => {
  beforeEach(() => {
    setupMocks();
  });

  it("returns shelter markers with valid coordinate pairs only", async () => {
    mocks.getShelters.mockResolvedValue([shelterWithCoords, shelterWithoutCoords]);
    mocks.getResources.mockResolvedValue([]);
    mocks.prisma.incident.findMany.mockResolvedValue([]);

    const result = await getOperationalMapData(ORG, ROLE_OWNER);

    expect(result.shelters).toHaveLength(1);
    expect(result.shelters[0].id).toBe("shelter-1");
    expect(result.shelters[0].latitude).toBe(45.5);
    expect(result.shelters[0].longitude).toBe(-122.7);
    expect(result.incidents).toHaveLength(0);
    expect(result.resources).toHaveLength(0);
  });

  it("returns incident markers with valid coordinate pairs only", async () => {
    mocks.getShelters.mockResolvedValue([]);
    mocks.getResources.mockResolvedValue([]);
    mocks.prisma.incident.findMany.mockResolvedValue([
      incidentWithCoords,
      incidentWithoutCoords,
    ]);

    const result = await getOperationalMapData(ORG, ROLE_OWNER);

    expect(result.incidents).toHaveLength(1);
    expect(result.incidents[0].id).toBe("incident-1");
    expect(result.incidents[0].latitude).toBe(40.0);
    expect(result.incidents[0].longitude).toBe(-74.0);
  });

  it("returns resource markers with valid coordinate pairs only", async () => {
    mocks.getShelters.mockResolvedValue([]);
    mocks.getResources.mockResolvedValue([
      resourceWithCoords,
      resourceWithoutCoords,
    ]);
    mocks.prisma.incident.findMany.mockResolvedValue([]);

    const result = await getOperationalMapData(ORG, ROLE_OWNER);

    expect(result.resources).toHaveLength(1);
    expect(result.resources[0].id).toBe("resource-1");
    expect(result.resources[0].latitude).toBe(34.0);
    expect(result.resources[0].longitude).toBe(-118.0);
  });

  it("accepts zero as a valid coordinate", async () => {
    const zeroCoordShelter = {
      ...shelterWithCoords,
      id: "shelter-zero",
      latitude: 0,
      longitude: 0,
      currentOccupancy: 0,
    };
    mocks.getShelters.mockResolvedValue([zeroCoordShelter]);
    mocks.getResources.mockResolvedValue([]);
    mocks.prisma.incident.findMany.mockResolvedValue([]);

    const result = await getOperationalMapData(ORG, ROLE_OWNER);

    expect(result.shelters).toHaveLength(1);
    expect(result.shelters[0].latitude).toBe(0);
    expect(result.shelters[0].longitude).toBe(0);
  });

  it("returns empty collections safely when no records match", async () => {
    mocks.getShelters.mockResolvedValue([]);
    mocks.getResources.mockResolvedValue([]);
    mocks.prisma.incident.findMany.mockResolvedValue([]);

    const result = await getOperationalMapData(ORG, ROLE_OWNER);

    expect(result.shelters).toEqual([]);
    expect(result.incidents).toEqual([]);
    expect(result.resources).toEqual([]);
  });

  it("preserves organization scoping for shelters and resources", async () => {
    mocks.getShelters.mockResolvedValue([]);
    mocks.getResources.mockResolvedValue([]);
    mocks.prisma.incident.findMany.mockResolvedValue([]);

    await getOperationalMapData(ORG, ROLE_OWNER);

    expect(mocks.getShelters).toHaveBeenCalledWith(ORG);
    expect(mocks.getResources).toHaveBeenCalledWith(ORG);
  });

  it("does not fetch shelters when VIEW_SHELTERS is not granted", async () => {
    mocks.hasOrganizationPermission.mockImplementation((r, p) => {
      if (p === "VIEW_SHELTERS") return false;
      return true;
    });
    mocks.getShelters.mockResolvedValue([]);
    mocks.getResources.mockResolvedValue([]);
    mocks.prisma.incident.findMany.mockResolvedValue([]);

    const result = await getOperationalMapData(ORG, ROLE_MEMBER);

    expect(mocks.getShelters).not.toHaveBeenCalled();
    expect(result.shelters).toEqual([]);
  });

  it("does not fetch resources when VIEW_RESOURCES is not granted", async () => {
    mocks.hasOrganizationPermission.mockImplementation((r, p) => {
      if (p === "VIEW_RESOURCES") return false;
      return true;
    });
    mocks.getShelters.mockResolvedValue([]);
    mocks.getResources.mockResolvedValue([]);
    mocks.prisma.incident.findMany.mockResolvedValue([]);

    const result = await getOperationalMapData(ORG, ROLE_MEMBER);

    expect(mocks.getResources).not.toHaveBeenCalled();
    expect(result.resources).toEqual([]);
  });

  it("includes derived shelter FULL status without persisting it", async () => {
    const fullShelter = {
      ...shelterWithCoords,
      status: "ACTIVE",
      currentOccupancy: 100,
      capacity: 100,
    };
    mocks.getShelters.mockResolvedValue([fullShelter]);
    mocks.getResources.mockResolvedValue([]);
    mocks.prisma.incident.findMany.mockResolvedValue([]);

    const result = await getOperationalMapData(ORG, ROLE_OWNER);

    expect(result.shelters[0].displayStatus).toBe("FULL");
    expect(result.shelters[0].status).toBe("ACTIVE");
  });

  it("incidents are scoped by lead organization or active participants", async () => {
    const scope = {
      OR: [
        { leadOrganizationId: ORG },
        {
          participants: {
            some: { organizationId: ORG, status: "ACTIVE" },
          },
        },
      ],
    };
    mocks.getShelters.mockResolvedValue([]);
    mocks.getResources.mockResolvedValue([]);
    mocks.prisma.incident.findMany.mockResolvedValue([]);

    await getOperationalMapData(ORG, ROLE_OWNER);

    expect(mocks.prisma.incident.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: scope }),
    );
  });
});
