/*
  Warnings:

  - A unique constraint covering the columns `[plan_id]` on the table `tbl_subscription_feature` will be added. If there are existing duplicate values, this will fail.
  - Made the column `features` on table `tbl_subscription_feature` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tbl_subscription_feature" ALTER COLUMN "features" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tbl_subscription_feature_plan_id_key" ON "tbl_subscription_feature"("plan_id");
