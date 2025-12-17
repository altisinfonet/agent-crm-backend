/*
  Warnings:

  - You are about to drop the column `product_type_id` on the `tbl_product_entity` table. All the data in the column will be lost.
  - You are about to drop the `tbl_product_type` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `product_id` to the `tbl_product_entity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `tbl_product_entity` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tbl_product_entity" DROP CONSTRAINT "tbl_product_entity_product_type_id_fkey";

-- DropIndex
DROP INDEX "tbl_product_entity_name_product_type_id_status_idx";

-- AlterTable
ALTER TABLE "tbl_product_entity" DROP COLUMN "product_type_id",
ADD COLUMN     "product_id" BIGINT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- DropTable
DROP TABLE "tbl_product_type";

-- CreateTable
CREATE TABLE "tbl_products" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_products_name_key" ON "tbl_products"("name");

-- CreateIndex
CREATE INDEX "tbl_products_name_status_idx" ON "tbl_products"("name", "status");

-- CreateIndex
CREATE INDEX "tbl_product_entity_name_slug_product_id_status_idx" ON "tbl_product_entity"("name", "slug", "product_id", "status");

-- AddForeignKey
ALTER TABLE "tbl_product_entity" ADD CONSTRAINT "tbl_product_entity_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tbl_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
