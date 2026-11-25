/*
  M5 Task 8: configurable low-stock threshold.

  Adds an optional per-inventory-item threshold used to derive low-stock alerts.
  Existing rows receive NULL (no threshold configured).
*/
-- AlterTable
ALTER TABLE "inventory_item" ADD COLUMN "lowStockThreshold" DECIMAL(14,3);