-- AlterEnum
ALTER TYPE "SaleProductType" ADD VALUE 'LOAN';

-- CreateTable
CREATE TABLE "tbl_product_loan" (
    "id" BIGSERIAL NOT NULL,
    "sale_id" BIGINT NOT NULL,
    "loan_type" TEXT NOT NULL,
    "loan_provider_name" TEXT NOT NULL,
    "loan_account_number" TEXT,
    "loan_amount" TEXT,
    "interest_rate" TEXT,
    "loan_tenure_months" INTEGER,
    "emi_amount" TEXT,
    "loan_start_date" TIMESTAMP(3),
    "loan_end_date" TIMESTAMP(3),
    "loan_status" TEXT,
    "property_value" TEXT,
    "property_address" TEXT,
    "vehicle_type" TEXT,
    "vehicle_brand" TEXT,
    "vehicle_model" TEXT,
    "vehicle_onroad_price" TEXT,
    "business_name" TEXT,
    "business_type" TEXT,
    "annual_turnover" TEXT,
    "processing_fee" TEXT,
    "commission_percentage" TEXT,
    "kyc_status" TEXT,
    "application_status" TEXT,
    "remarks" TEXT,
    "documents" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_loan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_product_loan_sale_id_key" ON "tbl_product_loan"("sale_id");

-- CreateIndex
CREATE INDEX "tbl_product_loan_loan_type_loan_provider_name_idx" ON "tbl_product_loan"("loan_type", "loan_provider_name");

-- AddForeignKey
ALTER TABLE "tbl_product_loan" ADD CONSTRAINT "tbl_product_loan_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "tbl_agent_sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
