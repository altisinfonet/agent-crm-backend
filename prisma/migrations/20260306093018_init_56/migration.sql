-- AlterTable
ALTER TABLE "tbl_customer" ADD COLUMN     "bank_account_number" TEXT,
ADD COLUMN     "bank_branch_name" TEXT,
ADD COLUMN     "bank_ifsc_code" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "cancelled_cheque_photo" TEXT,
ADD COLUMN     "income" TEXT,
ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "tbl_customer_supporting_documents" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT,
    "mime_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_customer_supporting_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_customer_supporting_documents_customer_id_idx" ON "tbl_customer_supporting_documents"("customer_id");

-- AddForeignKey
ALTER TABLE "tbl_customer_supporting_documents" ADD CONSTRAINT "tbl_customer_supporting_documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tbl_customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
