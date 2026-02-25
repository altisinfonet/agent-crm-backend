/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `tbl_products` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tbl_products_slug_key" ON "tbl_products"("slug");
