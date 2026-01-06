/*
  Warnings:

  - You are about to drop the column `expiry_reminder_sent` on the `tbl_org_subscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_org_subscription" DROP COLUMN "expiry_reminder_sent",
ADD COLUMN     "expiry_reminder_days_sent" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
