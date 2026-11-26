import { Prisma } from "@/generated/prisma/client";

export function selectFefoBatches<T extends { id: string; expiresAt: Date | null; onHand: Prisma.Decimal; reserved: Prisma.Decimal }>(
  batches: T[],
  quantity: Prisma.Decimal,
): { batch: T; quantity: Prisma.Decimal }[] {
  // Compute the current date once so expiry is evaluated consistently across every batch.
  const now = new Date();
  const eligible = batches
    .filter((b) => {
      const available = new Prisma.Decimal(b.onHand).minus(new Prisma.Decimal(b.reserved));
      if (!available.greaterThan(0)) return false;
      // Exclude expired batches; batches with no expiration date remain eligible.
      if (b.expiresAt !== null && b.expiresAt.getTime() < now.getTime()) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.expiresAt === null && b.expiresAt === null) return a.id.localeCompare(b.id);
      if (a.expiresAt === null) return 1;
      if (b.expiresAt === null) return -1;
      return a.expiresAt.getTime() - b.expiresAt.getTime();
    });

  const result: { batch: T; quantity: Prisma.Decimal }[] = [];
  let remaining = quantity;
  for (const batch of eligible) {
    if (remaining.lessThanOrEqualTo(0)) break;
    const available = new Prisma.Decimal(batch.onHand).minus(new Prisma.Decimal(batch.reserved));
    const take = available.lessThan(remaining) ? available : remaining;
    if (take.greaterThan(0)) {
      result.push({ batch, quantity: take });
      remaining = remaining.minus(take);
    }
  }
  return result;
}

export async function ensureOpeningBatch(tx: Prisma.TransactionClient, inventoryItemId: string, organizationId: string) {
  const item = await tx.inventoryItem.findFirst({
    where: { id: inventoryItemId, organizationId },
    select: { id: true, onHand: true, reserved: true },
  });
  if (!item) throw new Error("INVENTORY_NOT_FOUND");
  const existing = await tx.inventoryBatch.findFirst({
    where: { inventoryItemId, organizationId, batchNumber: "OPENING" },
  });
  if (existing) return existing;
  return tx.inventoryBatch.create({
    data: {
      id: `batch_opening_${inventoryItemId}`,
      inventoryItemId,
      organizationId,
      batchNumber: "OPENING",
      onHand: item.onHand,
      reserved: item.reserved,
    },
  });
}