/*
  Warnings:

  - The values [HALTED] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'UPGRADED', 'CANCELLED', 'EXPIRED', 'INCOMPLETE');
ALTER TABLE "tbl_org_subscription" ALTER COLUMN "status" TYPE "SubscriptionStatus_new" USING ("status"::text::"SubscriptionStatus_new");
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "public"."SubscriptionStatus_old";
COMMIT;
