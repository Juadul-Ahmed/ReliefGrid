import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { SHELTER_STATUSES } from "@/lib/validations/shelter.schema";

export interface ShelterFilters {
  search?: string;
  status?: string;
}

export interface ShelterSummary {
  id: string;
  name: string;
  address: string;
  capacity: number;
  currentOccupancy: number;
  status: string;
  displayStatus: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Derives the display status for a shelter.
 *
 * FULL is a derived state: when the stored status is ACTIVE and
 * currentOccupancy >= capacity, the shelter displays as FULL.
 * FULL is never written to the database; the stored status remains unchanged.
 */
export function deriveDisplayStatus(shelter: {
  status: string;
  currentOccupancy: number;
  capacity: number;
}): string {
  if (shelter.status === "ACTIVE" && shelter.currentOccupancy >= shelter.capacity) {
    return "FULL";
  }
  return shelter.status;
}

/**
 * Builds an organization-scoped Prisma filter for shelters.
 *
 * Organization scoping is mandatory: every query must include organizationId so
 * one organization can never see another organization's shelters.
 */
export function buildShelterFilters(
  organizationId: string,
  filters: ShelterFilters = {},
): Prisma.ShelterWhereInput {
  const search = filters.search?.trim();

  const conditions: Prisma.ShelterWhereInput[] = [{ organizationId }];

  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (
    filters.status &&
    SHELTER_STATUSES.includes(
      filters.status as (typeof SHELTER_STATUSES)[number],
    )
  ) {
    conditions.push({
      status: filters.status as (typeof SHELTER_STATUSES)[number],
    });
  }

  return { AND: conditions };
}

/**
 * Maps a Prisma shelter row to a ShelterSummary with derived display status.
 */
function toShelterSummary(row: {
  id: string;
  name: string;
  address: string;
  capacity: number;
  currentOccupancy: number;
  status: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
}): ShelterSummary {
  return {
    ...row,
    displayStatus: deriveDisplayStatus({
      status: row.status,
      currentOccupancy: row.currentOccupancy,
      capacity: row.capacity,
    }),
  };
}

/**
 * Returns up to 50 shelters for an organization, newest first.
 */
export async function getShelters(
  organizationId: string,
  filters: ShelterFilters = {},
) {
  const rows = await prisma.shelter.findMany({
    where: buildShelterFilters(organizationId, filters),
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      address: true,
      capacity: true,
      currentOccupancy: true,
      status: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return rows.map(toShelterSummary);
}

/**
 * Returns one shelter the organization is allowed to see.
 *
 * The lookup is always scoped by organizationId so a shelter belonging to
 * another organization is never returned (returns null instead).
 */
export async function getShelterById(
  shelterId: string,
  organizationId: string,
) {
  const row = await prisma.shelter.findFirst({
    where: {
      id: shelterId,
      organizationId,
    },
    select: {
      id: true,
      name: true,
      address: true,
      capacity: true,
      currentOccupancy: true,
      status: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!row) {
    return null;
  }

  return toShelterSummary(row);
}
