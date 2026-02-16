/*
  Warnings:

  - You are about to drop the column `aadhar_image` on the `tbl_agent_kyc` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tbl_agent_kyc" DROP COLUMN "aadhar_image",
ADD COLUMN     "aadhar_back" TEXT,
ADD COLUMN     "aadhar_front" TEXT;
