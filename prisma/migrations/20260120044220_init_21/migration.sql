-- DropIndex
DROP INDEX "tbl_menu_types_id_idx";

-- AlterTable
ALTER TABLE "tbl_product_entity" ADD COLUMN     "desc" TEXT,
ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "tbl_products" ADD COLUMN     "desc" TEXT,
ADD COLUMN     "image" TEXT;

-- CreateIndex
CREATE INDEX "tbl_menu_types_id_name_slug_idx" ON "tbl_menu_types"("id", "name", "slug");
