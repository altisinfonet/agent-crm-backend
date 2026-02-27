-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'UPGRADED';

-- AlterTable
ALTER TABLE "tbl_org_subscription" ADD COLUMN     "upgraded_from_id" BIGINT,
ADD COLUMN     "upgraded_to_id" BIGINT;

-- AddForeignKey
ALTER TABLE "tbl_org_subscription" ADD CONSTRAINT "tbl_org_subscription_upgraded_from_id_fkey" FOREIGN KEY ("upgraded_from_id") REFERENCES "tbl_org_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_org_subscription" ADD CONSTRAINT "tbl_org_subscription_upgraded_to_id_fkey" FOREIGN KEY ("upgraded_to_id") REFERENCES "tbl_org_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
