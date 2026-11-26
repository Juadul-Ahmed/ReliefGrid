import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { RESOURCE_CATEGORIES } from "@/lib/validations/resource.schema";

export interface ResourceFilters {
  search?: string;
  category?: string;
}

/**
 * Builds an organization-scoped Prisma filter for resources.
 *
 * Organization scoping is mandatory: every query must include organizationId so
 * one organization can never see another organization's resources.
 */
export function buildResourceFilters(
  organizationId: string,
  filters: ResourceFilters = {},
): Prisma.ResourceWhereInput {
  const search = filters.search?.trim();

  const conditions: Prisma.ResourceWhereInput[] = [{ organizationId }];

  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (
    filters.category &&
    RESOURCE_CATEGORIES.includes(
      filters.category as (typeof RESOURCE_CATEGORIES)[number],
    )
  ) {
    conditions.push({
      category: filters.category as (typeof RESOURCE_CATEGORIES)[number],
    });
  }

  return { AND: conditions };
}

/**
 * Returns up to 50 resources for an organization, newest first.
 */
export async function getResources(
  organizationId: string,
  filters: ResourceFilters = {},
) {
  return prisma.resource.findMany({
    where: buildResourceFilters(organizationId, filters),
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      category: true,
      unit: true,
      sku: true,
      locationName: true,
      address: true,
      latitude: true,
      longitude: true,
      isActive: true,
      createdAt: true,
    },
  });
}

/**
 * Returns one resource the organization is allowed to see.
 *
 * The lookup is always scoped by organizationId so a resource belonging to
 * another organization is never returned (returns null instead).
 */
export async function getResourceById(
  resourceId: string,
  organizationId: string,
) {
  return prisma.resource.findFirst({
    where: {
      id: resourceId,
      organizationId,
    },
    select: {
      id: true,
      name: true,
      category: true,
      unit: true,
      description: true,
      sku: true,
      locationName: true,
      address: true,
      latitude: true,
      longitude: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Returns the inventory item for a resource within the organization.
 *
 * Scoped by organizationId so another organization's inventory is never
 * exposed. Returns null when no inventory has been initialized.
 */
export async function getInventoryByResource(
  resourceId: string,
  organizationId: string,
) {
  return prisma.inventoryItem.findFirst({
    where: {
      resourceId,
      organizationId,
    },
    select: {
      id: true,
      onHand: true,
      reserved: true,
      lowStockThreshold: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}