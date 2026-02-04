/*
  Warnings:

  - You are about to drop the column `max_agents` on the `tbl_subscription_plan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_subscription_plan" DROP COLUMN "max_agents",
ADD COLUMN     "max_customers" INTEGER;
