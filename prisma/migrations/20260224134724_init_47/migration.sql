-- CreateEnum
CREATE TYPE "SaleProductType" AS ENUM ('FIXED_DEPOSIT', 'INSURANCE', 'MUTUAL_FUND', 'REAL_ESTATE');

-- CreateTable
CREATE TABLE "tbl_sale_documents" (
    "id" BIGSERIAL NOT NULL,
    "sale_id" BIGINT NOT NULL,
    "product_type" "SaleProductType" NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT,
    "mime_type" TEXT,
    "uploaded_by" BIGINT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" BIGINT,

    CONSTRAINT "tbl_sale_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_sale_documents_sale_id_idx" ON "tbl_sale_documents"("sale_id");

-- AddForeignKey
ALTER TABLE "tbl_sale_documents" ADD CONSTRAINT "tbl_sale_documents_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "tbl_agent_sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
