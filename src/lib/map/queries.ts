import { prisma } from "@/lib/db/prisma";

import { deriveDisplayStatus, getShelters } from "@/lib/shelters/queries";
import { getResources } from "@/lib/resources/queries";
import { getOrganizationIncidentScope } from "@/lib/incidents/queries";
import { hasOrganizationPermission } from "@/lib/permissions/organization-permissions";

export interface MapShelter {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  currentOccupancy: number;
  status: string;
  displayStatus: string;
}

export interface MapIncident {
  id: string;
  incidentNumber: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  locationName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface MapResource {
  id: string;
  name: string;
  category: string;
  unit: string;
  locationName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
}

export interface OperationalMapData {
  shelters: MapShelter[];
  incidents: MapIncident[];
  resources: MapResource[];
  canViewShelters: boolean;
  canViewResources: boolean;
}

function hasValidCoordinates(
  latitude: number | null,
  longitude: number | null,
): boolean {
  return latitude !== null && longitude !== null;
}

/**
 * Returns incidents visible to the organization with location fields selected.
 *
 * Uses getOrganizationIncidentScope to preserve lead-organization and
 * active-participant visibility. Does not modify existing incident listing
 * behavior.
 */
async function getIncidentsForMap(
  organizationId: string,
): Promise<MapIncident[]> {
  const scope = getOrganizationIncidentScope(organizationId);

  const rows = await prisma.incident.findMany({
    where: scope,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      incidentNumber: true,
      title: true,
      category: true,
      severity: true,
      status: true,
      locationName: true,
      address: true,
      latitude: true,
      longitude: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    incidentNumber: row.incidentNumber,
    title: row.title,
    category: row.category,
    severity: row.severity,
    status: row.status,
    locationName: row.locationName,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
  }));
}

/**
 * Fetches all operational map data for an organization, respecting tenant
 * isolation and view permissions.
 *
 * The map page should call requireOrganization() to obtain the authenticated
 * organizationId and membership role, then pass both to this function.
 *
 * Collections are conditionally fetched based on view permissions:
 *   - Shelters: only fetched when VIEW_SHELTERS is granted
 *   - Resources: only fetched when VIEW_RESOURCES is granted
 *   - Incidents: always fetched, scoped by lead-organization or active
 *     participant membership (no separate incident view permission exists)
 *
 * Only records where BOTH latitude and longitude are non-null are returned.
 * Zero is a valid coordinate.
 */
export async function getOperationalMapData(
  organizationId: string,
  role: string,
): Promise<OperationalMapData> {
  const canViewShelters = hasOrganizationPermission(role, "VIEW_SHELTERS");
  const canViewResources = hasOrganizationPermission(role, "VIEW_RESOURCES");

  const [shelters, incidents, resources] = await Promise.all([
    canViewShelters
      ? getShelters(organizationId).then((rows) =>
          rows.map((s) => ({
            id: s.id,
            name: s.name,
            address: s.address,
            latitude: s.latitude,
            longitude: s.longitude,
            capacity: s.capacity,
            currentOccupancy: s.currentOccupancy,
            status: s.status,
            displayStatus: deriveDisplayStatus({
              status: s.status,
              currentOccupancy: s.currentOccupancy,
              capacity: s.capacity,
            }),
          })),
        )
      : Promise.resolve([] as MapShelter[]),
    getIncidentsForMap(organizationId),
    canViewResources
      ? getResources(organizationId).then((rows) =>
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            unit: r.unit,
            locationName: r.locationName,
            address: r.address,
            latitude: r.latitude,
            longitude: r.longitude,
            isActive: r.isActive,
          })),
        )
      : Promise.resolve([] as MapResource[]),
  ]);

  return {
    shelters: shelters.filter((s) => hasValidCoordinates(s.latitude, s.longitude)),
    incidents: incidents.filter((i) =>
      hasValidCoordinates(i.latitude, i.longitude),
    ),
    resources: resources.filter((r) =>
      hasValidCoordinates(r.latitude, r.longitude),
    ),
    canViewShelters,
    canViewResources,
  };
}
