/*
  Warnings:

  - Changed the type of `status` on the `tbl_org_subscription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `tbl_razorpay_subscription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "tbl_org_subscription" DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL;

-- AlterTable
ALTER TABLE "tbl_razorpay_subscription" DROP COLUMN "status",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL;

-- CreateIndex
CREATE INDEX "tbl_org_subscription_org_id_plan_id_status_idx" ON "tbl_org_subscription"("org_id", "plan_id", "status");
