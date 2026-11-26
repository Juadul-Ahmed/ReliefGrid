import { requireOrganization } from "@/lib/permissions/organization";
import { getOperationalMapData } from "@/lib/map/queries";
import { OperationalMap } from "@/components/map/OperationalMap";

export default async function MapPage() {
  const { organizationId, membership } = await requireOrganization();

  const role = membership.role.toUpperCase();

  const mapData = await getOperationalMapData(organizationId, role);

  const hasAnyMarkers =
    mapData.shelters.length > 0 ||
    mapData.incidents.length > 0 ||
    mapData.resources.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operational Map</h1>
        <p className="mt-1 text-sm text-muted">
          Shelter, incident, and resource locations for your organization.
        </p>
      </div>

      <OperationalMap
        shelters={mapData.shelters}
        incidents={mapData.incidents}
        resources={mapData.resources}
        canViewShelters={mapData.canViewShelters}
        canViewResources={mapData.canViewResources}
        hasAnyMarkers={hasAnyMarkers}
      />
    </div>
  );
}
