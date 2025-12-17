/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `tbl_product_entity` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tbl_product_entity_slug_key" ON "tbl_product_entity"("slug");
