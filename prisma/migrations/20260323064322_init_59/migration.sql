/*
  Warnings:

  - A unique constraint covering the columns `[user_name]` on the table `tbl_user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tbl_user" ADD COLUMN     "user_name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_user_name_key" ON "tbl_user"("user_name");
