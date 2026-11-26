"use client";

import L, { Map as LeafletMap } from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayerGroup,
} from "react-leaflet";
import { useEffect, useRef, useState, useMemo } from "react";
import { HiOutlineUsers, HiOutlineFire, HiOutlineHome } from "react-icons/hi2";

import type {
  MapShelter,
  MapIncident,
  MapResource,
} from "@/lib/map/queries";

const shelterIcon = L.divIcon({
  className: "",
  html: `<div style="background-color:#22c55e;width:14px;height:14px;border-radius:50%;border:2px solid #ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const incidentIcon = L.divIcon({
  className: "",
  html: `<div style="background-color:#ef4444;width:14px;height:14px;border-radius:50%;border:2px solid #ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const resourceIcon = L.divIcon({
  className: "",
  html: `<div style="background-color:#3b82f6;width:14px;height:14px;border-radius:50%;border:2px solid #ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

function computeBounds(
  items: Array<{ latitude: number | null; longitude: number | null }>,
): MapBounds | null {
  const valid = items.filter(
    (i) => i.latitude !== null && i.longitude !== null,
  );
  if (valid.length === 0) return null;

  const lats = valid.map((i) => i.latitude!);
  const lngs = valid.map((i) => i.longitude!);

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

interface OperationalMapClientProps {
  shelters: MapShelter[];
  incidents: MapIncident[];
  resources: MapResource[];
  canViewShelters: boolean;
  canViewResources: boolean;
  hasAnyMarkers: boolean;
}

export function OperationalMapClient({
  shelters,
  incidents,
  resources,
  canViewShelters,
  canViewResources,
  hasAnyMarkers,
}: OperationalMapClientProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const boundsRef = useRef<MapBounds | null>(null);
  const [showShelters, setShowShelters] = useState(canViewShelters);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showResources, setShowResources] = useState(canViewResources);

  const mappableShelters = shelters.filter(
    (s) => s.latitude !== null && s.longitude !== null,
  );
  const mappableIncidents = incidents.filter(
    (i) => i.latitude !== null && i.longitude !== null,
  );
  const mappableResources = resources.filter(
    (r) => r.latitude !== null && r.longitude !== null,
  );

  const allItems = useMemo(
    () => [
      ...mappableShelters,
      ...mappableIncidents,
      ...mappableResources,
    ],
    [mappableShelters, mappableIncidents, mappableResources],
  );

  useEffect(() => {
    boundsRef.current = computeBounds(allItems);
  }, [allItems]);

  const fitToMarkers = () => {
    const map = mapRef.current;
    const bounds = boundsRef.current;
    if (!map || !bounds) return;

    map.fitBounds(
      [
        [bounds.minLat, bounds.minLng],
        [bounds.maxLat, bounds.maxLng],
      ],
      { padding: [40, 40] },
    );
  };

  useEffect(() => {
    if (hasAnyMarkers && mapRef.current && boundsRef.current) {
      fitToMarkers();
    }
  }, [hasAnyMarkers, shelters, incidents, resources]);

  const hasShelterMarkers = mappableShelters.length > 0;
  const hasIncidentMarkers = mappableIncidents.length > 0;
  const hasResourceMarkers = mappableResources.length > 0;
  const anyMarkers =
    hasShelterMarkers || hasIncidentMarkers || hasResourceMarkers;

  const occupancyColor = (
    resource: MapResource
  ): string => {
    return resource.isActive
      ? "bg-green-500/10 text-green-600"
      : "bg-muted/10 text-muted";
  };

  const occupancyLabel = (resource: MapResource): string => {
    return resource.isActive ? "Active" : "Inactive";
  };

  const canShowShelters = canViewShelters && hasShelterMarkers;
  const canShowIncidents = hasIncidentMarkers;
  const canShowResources = canViewResources && hasResourceMarkers;

  const mapContent = (
    <div className="relative h-full w-full">
      <MapContainer
        ref={mapRef}
        center={[20, 0]}
        zoom={2}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {canShowShelters && showShelters && (
          <LayerGroup>
            {mappableShelters.map((shelter) => (
              <Marker
                key={shelter.id}
                position={[shelter.latitude!, shelter.longitude!]}
                icon={shelterIcon}
              >
                <Popup>
                  <div className="max-w-xs">
                    <div className="flex items-start gap-2">
                      <HiOutlineUsers
                        className="size-4 text-green-600 mt-0.5"
                      />
                      <h3 className="font-semibold">{shelter.name}</h3>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {shelter.address}
                    </p>
                    <p className="mt-1 text-sm">
                      {shelter.currentOccupancy} / {shelter.capacity}
                    </p>
                    <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold bg-green-500/10 text-green-600">
                      {shelter.status}
                    </span>
                    {shelter.displayStatus !== shelter.status && (
                      <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-600">
                        {shelter.displayStatus}
                      </span>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </LayerGroup>
        )}

        {canShowIncidents && showIncidents && (
          <LayerGroup>
            {mappableIncidents.map((incident) => (
              <Marker
                key={incident.id}
                position={[incident.latitude!, incident.longitude!]}
                icon={incidentIcon}
              >
                <Popup>
                  <div className="max-w-xs">
                    <div className="flex items-start gap-2">
                      <HiOutlineFire
                        className="size-4 text-red-600 mt-0.5"
                      />
                      <h3 className="font-semibold">
                        {incident.title}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {incident.incidentNumber}
                    </p>
                    <p className="mt-1 text-sm">
                      {incident.category} \u2022 {incident.severity}
                    </p>
                    <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold bg-red-500/10 text-red-600">
                      {incident.status}
                    </span>
                    {incident.locationName && (
                      <p className="mt-1 text-sm text-muted">
                        {incident.locationName}
                      </p>
                    )}
                    {incident.address && (
                      <p className="mt-1 text-sm text-muted">
                        {incident.address}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </LayerGroup>
        )}

        {canShowResources && showResources && (
          <LayerGroup>
            {mappableResources.map((resource) => (
              <Marker
                key={resource.id}
                position={[resource.latitude!, resource.longitude!]}
                icon={resourceIcon}
              >
                <Popup>
                  <div className="max-w-xs">
                    <div className="flex items-start gap-2">
                      <HiOutlineHome
                        className="size-4 text-blue-600 mt-0.5"
                      />
                      <h3 className="font-semibold">
                        {resource.name}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {resource.category} \u2022 {resource.unit}
                    </p>
                    {resource.locationName && (
                      <p className="mt-1 text-sm text-muted">
                        {resource.locationName}
                      </p>
                    )}
                    {resource.address && (
                      <p className="mt-1 text-sm text-muted">
                        {resource.address}
                      </p>
                    )}
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${occupancyColor(resource)}`}>
                      {occupancyLabel(resource)}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </LayerGroup>
        )}

        {/* Layer controls overlay */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 rounded-lg border border-border p-3 shadow-sm bg-white/[0.9] backdrop-blur-sm">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Layers
          </div>
          {canViewShelters && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showShelters}
                onChange={(e) => setShowShelters(e.target.checked)}
                disabled={!hasShelterMarkers}
                className="rounded border border-border text-primary focus:ring-primary"
              />
              <span className="text-sm">
                Shelters
                {!hasShelterMarkers && (
                  <span className="ml-1 text-xs text-muted">(none)</span>
                )}
              </span>
            </label>
          )}
          {hasIncidentMarkers && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showIncidents}
                onChange={(e) => setShowIncidents(e.target.checked)}
                disabled={!hasIncidentMarkers}
                className="rounded border border-border text-primary focus:ring-primary"
              />
              <span className="text-sm">
                Incidents
                {!hasIncidentMarkers && (
                  <span className="ml-1 text-xs text-muted">(none)</span>
                )}
              </span>
            </label>
          )}
          {canViewResources && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showResources}
                onChange={(e) => setShowResources(e.target.checked)}
                disabled={!hasResourceMarkers}
                className="rounded border border-border text-primary focus:ring-primary"
              />
              <span className="text-sm">
                Resources
                {!hasResourceMarkers && (
                  <span className="ml-1 text-xs text-muted">(none)</span>
                )}
              </span>
            </label>
          )}
        </div>

        {/* Legend overlay */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1 rounded-lg border border-border p-3 shadow-sm bg-white/[0.9] backdrop-blur-sm">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Legend
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="rounded-full bg-green-500 size-3 border border-white/50"
            />
            <span className="text-xs">Shelters</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="rounded-full bg-red-500 size-3 border border-white/50"
            />
            <span className="text-xs">Incidents</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="rounded-full bg-blue-500 size-3 border border-white/50"
            />
            <span className="text-xs">Resources</span>
          </div>
        </div>
      </MapContainer>
    </div>
  );

  const emptyStateContent = canViewShelters === false && canViewResources === false ? (
    <div>
      <HiOutlineHome className="mb-3 size-12 text-muted" />
      <h3 className="text-lg font-semibold">
        No mappable data available
      </h3>
      <p className="mt-1 text-sm text-muted">
        You do not have permission to view shelters or resources on the map.
      </p>
    </div>
  ) : (
    <div>
      <HiOutlineHome className="mb-3 size-12 text-muted" />
      <h3 className="text-lg font-semibold">No locations on the map</h3>
      <p className="mt-1 text-sm text-muted">
        No shelters, incidents, or resources with coordinates have been
        added yet.
      </p>
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden aspect-[4/3] relative">
      {!anyMarkers ? (
        <div className="absolute inset-0 flex h-full flex-col items-center justify-center p-8 text-center">
          {emptyStateContent}
        </div>
      ) : (
        <div className="h-full w-full">{mapContent}</div>
      )}
    </div>
  );
}
