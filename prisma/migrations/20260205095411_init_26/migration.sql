-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('INCOMPLETED', 'ONGOING', 'COMPLETED');

-- AlterTable
ALTER TABLE "tbl_user" ADD COLUMN     "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'INCOMPLETED';
