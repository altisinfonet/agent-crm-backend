/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `tbl_org_subscription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[org_id,rzp_subscription_id]` on the table `tbl_org_subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "tbl_org_subscription_org_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "tbl_org_subscription_id_key" ON "tbl_org_subscription"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_org_subscription_org_id_rzp_subscription_id_key" ON "tbl_org_subscription"("org_id", "rzp_subscription_id");
