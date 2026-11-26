"use client";

import dynamic from "next/dynamic";
import type {
  MapShelter,
  MapIncident,
  MapResource,
} from "@/lib/map/queries";

interface OperationalMapProps {
  shelters: MapShelter[];
  incidents: MapIncident[];
  resources: MapResource[];
  canViewShelters: boolean;
  canViewResources: boolean;
  hasAnyMarkers: boolean;
}

const OperationalMapClient = dynamic(
  () => import("./OperationalMapClient").then((mod) => mod.OperationalMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-border bg-surface overflow-hidden aspect-[4/3] relative flex items-center justify-center p-8 text-center">
        <p className="text-sm text-muted">Loading map...</p>
      </div>
    ),
  },
);

export function OperationalMap({
  shelters,
  incidents,
  resources,
  canViewShelters,
  canViewResources,
  hasAnyMarkers,
}: OperationalMapProps) {
  return (
    <OperationalMapClient
      shelters={shelters}
      incidents={incidents}
      resources={resources}
      canViewShelters={canViewShelters}
      canViewResources={canViewResources}
      hasAnyMarkers={hasAnyMarkers}
    />
  );
}
