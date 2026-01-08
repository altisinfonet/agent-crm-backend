/*
  Warnings:

  - A unique constraint covering the columns `[provider_id]` on the table `tbl_user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_provider_id_key" ON "tbl_user"("provider_id");
