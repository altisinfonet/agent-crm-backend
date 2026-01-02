-- AlterTable
ALTER TABLE "tbl_subscription_plan" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'INACTIVE',
ALTER COLUMN "max_agents" DROP NOT NULL;
