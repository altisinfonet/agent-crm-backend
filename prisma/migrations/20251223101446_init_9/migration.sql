-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('RAZORPAY', 'ADMIN');

-- AlterTable
ALTER TABLE "tbl_org_subscription" ADD COLUMN     "source" "SubscriptionSource" NOT NULL DEFAULT 'RAZORPAY';
