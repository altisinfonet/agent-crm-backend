/*
  Warnings:

  - A unique constraint covering the columns `[rzp_payment_id]` on the table `tbl_org_subscription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[signature]` on the table `tbl_org_subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tbl_org_subscription" ADD COLUMN     "rzp_payment_id" TEXT,
ADD COLUMN     "signature" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tbl_org_subscription_rzp_payment_id_key" ON "tbl_org_subscription"("rzp_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_org_subscription_signature_key" ON "tbl_org_subscription"("signature");
