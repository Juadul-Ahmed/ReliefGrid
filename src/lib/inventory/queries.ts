import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";

export const STOCK_MOVEMENT_TYPES = [
  "IN",
  "OUT",
  "RESERVE",
  "RELEASE",
  "ADJUST",
] as const;

export type StockMovementTypeValue = (typeof STOCK_MOVEMENT_TYPES)[number];

export const STOCK_MOVEMENT_PAGE_SIZE = 50;

export interface StockMovementFilters {
  resourceId?: string;
  inventoryItemId?: string;
  type?: string;
  page?: number;
}

function isStockMovementType(
  value: string,
): value is StockMovementTypeValue {
  return (STOCK_MOVEMENT_TYPES as readonly string[]).includes(value);
}

function buildMovementWhere(
  organizationId: string,
  filters: StockMovementFilters,
): Prisma.StockMovementWhereInput {
  // Every movement is scoped through its inventory item's organization.
  const inventoryWhere: Prisma.InventoryItemWhereInput = { organizationId };

  if (filters.inventoryItemId) {
    inventoryWhere.id = filters.inventoryItemId;
  }

  if (filters.resourceId) {
    inventoryWhere.resourceId = filters.resourceId;
  }

  const where: Prisma.StockMovementWhereInput = {
    inventoryItem: inventoryWhere,
  };

  if (filters.type && isStockMovementType(filters.type)) {
    where.type = filters.type;
  }

  return where;
}

export interface StockMovementPage {
  items: {
    id: string;
    type: string;
    quantity: string;
    reason: string | null;
    createdAt: Date;
    actorName: string | null;
    inventoryItemId: string;
    resourceId: string;
    resourceName: string;
    unit: string;
  }[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Returns a bounded, organization-scoped page of stock movements.
 */
export async function getStockMovements(
  organizationId: string,
  filters: StockMovementFilters = {},
): Promise<StockMovementPage> {
  const page = Math.max(1, Math.floor(filters.page ?? 1));

  const where = buildMovementWhere(organizationId, filters);

  const [rows, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: STOCK_MOVEMENT_PAGE_SIZE,
      skip: (page - 1) * STOCK_MOVEMENT_PAGE_SIZE,
      select: {
        id: true,
        type: true,
        quantity: true,
        reason: true,
        createdAt: true,
        actor: { select: { name: true } },
        inventoryItem: {
          select: {
            id: true,
            resourceId: true,
            resource: { select: { name: true, unit: true } },
          },
        },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      type: row.type,
      quantity: row.quantity.toString(),
      reason: row.reason,
      createdAt: row.createdAt,
      actorName: row.actor?.name ?? null,
      inventoryItemId: row.inventoryItem.id,
      resourceId: row.inventoryItem.resourceId,
      resourceName: row.inventoryItem.resource.name,
      unit: row.inventoryItem.resource.unit,
    })),
    total,
    page,
    pageSize: STOCK_MOVEMENT_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / STOCK_MOVEMENT_PAGE_SIZE)),
  };
}

export async function getStockMovementsForResource(
  resourceId: string,
  organizationId: string,
  filters: Omit<StockMovementFilters, "resourceId"> = {},
) {
  return getStockMovements(organizationId, { ...filters, resourceId });
}

export interface InventoryStats {
  activeResources: number;
  inventoryItems: number;
  onHand: string;
  reserved: string;
  available: string;
}

/**
 * Organization-scoped inventory statistics using Decimal arithmetic.
 */
export async function getInventoryStats(
  organizationId: string,
): Promise<InventoryStats> {
  const [activeResources, itemAgg] = await Promise.all([
    prisma.resource.count({
      where: { organizationId, isActive: true },
    }),
    prisma.inventoryItem.aggregate({
      where: { organizationId, isActive: true },
      _count: { _all: true },
      _sum: { onHand: true, reserved: true },
    }),
  ]);

  const onHand = itemAgg._sum.onHand ?? new Prisma.Decimal(0);
  const reserved = itemAgg._sum.reserved ?? new Prisma.Decimal(0);
  const available = onHand.minus(reserved);

  return {
    activeResources,
    inventoryItems: itemAgg._count._all,
    onHand: onHand.toString(),
    reserved: reserved.toString(),
    available: available.toString(),
  };
}

export type InventoryStockStatus = "OUT" | "LOW" | "OK";

export interface InventoryOverviewItem {
  id: string;
  resourceId: string;
  resourceName: string;
  unit: string;
  onHand: string;
  reserved: string;
  available: string;
  lowStockThreshold: string | null;
  status: InventoryStockStatus;
}

export interface InventoryOverview {
  items: InventoryOverviewItem[];
  lowStock: InventoryOverviewItem[];
  outOfStock: InventoryOverviewItem[];
}

/**
 * Organization-scoped inventory overview with derived low/out-of-stock status.
 */
export async function getInventoryOverview(
  organizationId: string,
): Promise<InventoryOverview> {
  const rows = await prisma.inventoryItem.findMany({
    where: { organizationId, isActive: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      resourceId: true,
      onHand: true,
      reserved: true,
      lowStockThreshold: true,
      resource: { select: { name: true, unit: true } },
    },
  });

  const items: InventoryOverviewItem[] = rows.map((row) => {
    const onHand = new Prisma.Decimal(row.onHand);
    const reserved = new Prisma.Decimal(row.reserved);
    const available = onHand.minus(reserved);

    let status: InventoryStockStatus = "OK";

    if (onHand.lte(0)) {
      status = "OUT";
    } else if (
      row.lowStockThreshold !== null &&
      available.lte(new Prisma.Decimal(row.lowStockThreshold))
    ) {
      status = "LOW";
    }

    return {
      id: row.id,
      resourceId: row.resourceId,
      resourceName: row.resource.name,
      unit: row.resource.unit,
      onHand: onHand.toString(),
      reserved: reserved.toString(),
      available: available.toString(),
      lowStockThreshold:
        row.lowStockThreshold === null
          ? null
          : new Prisma.Decimal(row.lowStockThreshold).toString(),
      status,
    };
  });

  return {
    items,
    lowStock: items.filter((item) => item.status === "LOW"),
    outOfStock: items.filter((item) => item.status === "OUT"),
  };
}