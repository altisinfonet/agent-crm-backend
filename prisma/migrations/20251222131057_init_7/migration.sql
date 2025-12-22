-- AlterTable
ALTER TABLE "tbl_org_subscription" ADD COLUMN     "last_reconciled_at" TIMESTAMP(3),
ADD COLUMN     "reconciliation_attempts" INTEGER NOT NULL DEFAULT 0;
