/*
  Warnings:

  - The values [UPGRADED] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `upgraded_from_id` on the `tbl_org_subscription` table. All the data in the column will be lost.
  - You are about to drop the column `upgraded_to_id` on the `tbl_org_subscription` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('TRIAL', 'PENDING', 'ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'INCOMPLETE');
ALTER TABLE "tbl_org_subscription" ALTER COLUMN "status" TYPE "SubscriptionStatus_new" USING ("status"::text::"SubscriptionStatus_new");
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "public"."SubscriptionStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "tbl_org_subscription" DROP CONSTRAINT "tbl_org_subscription_upgraded_from_id_fkey";

-- DropForeignKey
ALTER TABLE "tbl_org_subscription" DROP CONSTRAINT "tbl_org_subscription_upgraded_to_id_fkey";

-- AlterTable
ALTER TABLE "tbl_org_subscription" DROP COLUMN "upgraded_from_id",
DROP COLUMN "upgraded_to_id",
ADD COLUMN     "upgraded_at" TIMESTAMP(3);
