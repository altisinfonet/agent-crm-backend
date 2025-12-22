/*
  Warnings:

  - A unique constraint covering the columns `[created_by]` on the table `tbl_organization` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tbl_organization" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "tbl_organization_created_by_key" ON "tbl_organization"("created_by");
