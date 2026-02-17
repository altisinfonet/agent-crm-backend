-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('NEW_LEAD', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'CONVERTED', 'UNQUALIFIED', 'FOLLOW_UP', 'LOST');

-- AlterTable
ALTER TABLE "tbl_customer" ADD COLUMN     "status" "CustomerStatus" NOT NULL DEFAULT 'NEW_LEAD';
