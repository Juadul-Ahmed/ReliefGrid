/*
  RESOURCE LOCATION FIELDS
  Add optional location fields to Resource model.

  Additive migration. Existing M4/M5/M6 tables, columns, enums, indexes,
  foreign keys, and raw SQL CHECK constraints are left untouched.

  Tenant integrity is preserved by the organizationId foreign key on
  resource, ensuring every resource belongs to exactly one provider
  organization.

  All four new columns are nullable, so existing resource records are
  preserved without requiring data migration.

  Database CHECK constraints enforce:
    - latitude must be between -90 and 90 when provided
    - longitude must be between -180 and 180 when provided
*/

-- AlterTable
ALTER TABLE "resource" ADD COLUMN "locationName" TEXT;
ALTER TABLE "resource" ADD COLUMN "address" TEXT;
ALTER TABLE "resource" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "resource" ADD COLUMN "longitude" DOUBLE PRECISION;

-- CHECK constraints for coordinate validity
ALTER TABLE "resource" ADD CONSTRAINT "resource_latitude_range" CHECK ("latitude" >= -90 AND "latitude" <= 90);
ALTER TABLE "resource" ADD CONSTRAINT "resource_longitude_range" CHECK ("longitude" >= -180 AND "longitude" <= 180);
