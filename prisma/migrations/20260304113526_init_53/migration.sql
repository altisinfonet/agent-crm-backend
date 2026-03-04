/*
  Warnings:

  - The `product_type` column on the `tbl_agent_form_suggestions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "tbl_agent_form_suggestions" DROP COLUMN "product_type",
ADD COLUMN     "product_type" TEXT;

-- CreateIndex
CREATE INDEX "tbl_agent_form_suggestions_agent_id_product_type_field_name_idx" ON "tbl_agent_form_suggestions"("agent_id", "product_type", "field_name");

-- AddForeignKey
ALTER TABLE "tbl_agent_form_suggestions" ADD CONSTRAINT "tbl_agent_form_suggestions_product_type_fkey" FOREIGN KEY ("product_type") REFERENCES "tbl_products"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
