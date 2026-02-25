/*
  Warnings:

  - You are about to drop the column `fund_house` on the `tbl_product_mutual_fund` table. All the data in the column will be lost.
  - You are about to drop the column `investment_type` on the `tbl_product_mutual_fund` table. All the data in the column will be lost.
  - You are about to drop the column `nav` on the `tbl_product_mutual_fund` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `tbl_product_mutual_fund` table. All the data in the column will be lost.
  - You are about to drop the column `risk_profile` on the `tbl_product_mutual_fund` table. All the data in the column will be lost.
  - You are about to drop the column `sip_end_date` on the `tbl_product_mutual_fund` table. All the data in the column will be lost.
  - You are about to drop the column `sip_start_date` on the `tbl_product_mutual_fund` table. All the data in the column will be lost.
  - You are about to drop the column `units` on the `tbl_product_mutual_fund` table. All the data in the column will be lost.
  - You are about to drop the column `agreement_date` on the `tbl_product_real_estate` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `tbl_product_real_estate` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `tbl_product_real_estate` table. All the data in the column will be lost.
  - You are about to drop the column `possession_date` on the `tbl_product_real_estate` table. All the data in the column will be lost.
  - You are about to drop the column `property_name` on the `tbl_product_real_estate` table. All the data in the column will be lost.
  - You are about to drop the column `property_value` on the `tbl_product_real_estate` table. All the data in the column will be lost.
  - You are about to drop the `tbl_product_life_insurance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_product_medical_insurance` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `fund_type` to the `tbl_product_mutual_fund` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transaction_type` to the `tbl_product_real_estate` table without a default value. This is not possible if the table is not empty.
  - Made the column `property_type` on table `tbl_product_real_estate` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "tbl_product_life_insurance" DROP CONSTRAINT "tbl_product_life_insurance_sale_id_fkey";

-- DropForeignKey
ALTER TABLE "tbl_product_medical_insurance" DROP CONSTRAINT "tbl_product_medical_insurance_sale_id_fkey";

-- DropIndex
DROP INDEX "tbl_product_mutual_fund_folio_number_scheme_name_investment_idx";

-- DropIndex
DROP INDEX "tbl_product_real_estate_property_type_location_property_nam_idx";

-- AlterTable
ALTER TABLE "tbl_product_mutual_fund" DROP COLUMN "fund_house",
DROP COLUMN "investment_type",
DROP COLUMN "nav",
DROP COLUMN "notes",
DROP COLUMN "risk_profile",
DROP COLUMN "sip_end_date",
DROP COLUMN "sip_start_date",
DROP COLUMN "units",
ADD COLUMN     "amc_name" TEXT,
ADD COLUMN     "commission_amount" DOUBLE PRECISION,
ADD COLUMN     "commission_percentage" DOUBLE PRECISION,
ADD COLUMN     "current_value" DOUBLE PRECISION,
ADD COLUMN     "fatca_status" TEXT,
ADD COLUMN     "fund_sub_type" TEXT,
ADD COLUMN     "fund_type" TEXT NOT NULL,
ADD COLUMN     "investment_mode" TEXT,
ADD COLUMN     "kyc_status" TEXT,
ADD COLUMN     "nav_at_purchase" DOUBLE PRECISION,
ADD COLUMN     "nominee_name" TEXT,
ADD COLUMN     "nominee_relationship" TEXT,
ADD COLUMN     "sip_amount" DOUBLE PRECISION,
ADD COLUMN     "sip_frequency" TEXT,
ADD COLUMN     "start_date" TIMESTAMP(3),
ADD COLUMN     "units_allocated" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "tbl_product_real_estate" DROP COLUMN "agreement_date",
DROP COLUMN "location",
DROP COLUMN "notes",
DROP COLUMN "possession_date",
DROP COLUMN "property_name",
DROP COLUMN "property_value",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "commission_amount" DOUBLE PRECISION,
ADD COLUMN     "commission_percentage" DOUBLE PRECISION,
ADD COLUMN     "document_status" TEXT,
ADD COLUMN     "loan_required" BOOLEAN,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "property_address" TEXT,
ADD COLUMN     "property_title" TEXT,
ADD COLUMN     "rera_number" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "transaction_type" TEXT NOT NULL,
ALTER COLUMN "property_type" SET NOT NULL;

-- DropTable
DROP TABLE "tbl_product_life_insurance";

-- DropTable
DROP TABLE "tbl_product_medical_insurance";

-- CreateTable
CREATE TABLE "tbl_product_fixed_deposit" (
    "id" BIGSERIAL NOT NULL,
    "sale_id" BIGINT NOT NULL,
    "product_type" TEXT NOT NULL,
    "bank_name" TEXT,
    "branch_name" TEXT,
    "deposit_amount" DOUBLE PRECISION,
    "interest_rate" DOUBLE PRECISION,
    "tenure_months" INTEGER,
    "start_date" TIMESTAMP(3),
    "maturity_date" TIMESTAMP(3),
    "maturity_amount" DOUBLE PRECISION,
    "payout_type" TEXT,
    "nominee_name" TEXT,
    "nominee_relationship" TEXT,
    "commission_percentage" DOUBLE PRECISION,
    "commission_amount" DOUBLE PRECISION,
    "kyc_status" TEXT,
    "application_status" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_fixed_deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_insurance" (
    "id" BIGSERIAL NOT NULL,
    "sale_id" BIGINT NOT NULL,
    "insurance_type" TEXT NOT NULL,
    "policy_type" TEXT NOT NULL,
    "insurance_company_name" TEXT,
    "policy_number" TEXT,
    "sum_assured" DOUBLE PRECISION,
    "premium_amount" DOUBLE PRECISION,
    "premium_payment_frequency" "SubscriptionCycle",
    "policy_term_years" INTEGER,
    "policy_start_date" TIMESTAMP(3),
    "policy_end_date" TIMESTAMP(3),
    "nominee_name" TEXT,
    "nominee_relationship" TEXT,
    "pre_existing_diseases" TEXT,
    "smoking_status" TEXT,
    "vehicle_type" TEXT,
    "vehicle_registration_number" TEXT,
    "vehicle_make" TEXT,
    "vehicle_model" TEXT,
    "manufacturing_year" INTEGER,
    "engine_number" TEXT,
    "chassis_number" TEXT,
    "commission_percentage" DOUBLE PRECISION,
    "commission_amount" DOUBLE PRECISION,
    "kyc_status" TEXT,
    "proposal_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_insurance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_product_fixed_deposit_sale_id_key" ON "tbl_product_fixed_deposit"("sale_id");

-- CreateIndex
CREATE INDEX "tbl_product_fixed_deposit_product_type_bank_name_idx" ON "tbl_product_fixed_deposit"("product_type", "bank_name");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_product_insurance_sale_id_key" ON "tbl_product_insurance"("sale_id");

-- CreateIndex
CREATE INDEX "tbl_product_insurance_insurance_type_policy_number_idx" ON "tbl_product_insurance"("insurance_type", "policy_number");

-- CreateIndex
CREATE INDEX "tbl_product_mutual_fund_fund_type_scheme_name_idx" ON "tbl_product_mutual_fund"("fund_type", "scheme_name");

-- CreateIndex
CREATE INDEX "tbl_product_real_estate_property_type_city_idx" ON "tbl_product_real_estate"("property_type", "city");

-- AddForeignKey
ALTER TABLE "tbl_product_fixed_deposit" ADD CONSTRAINT "tbl_product_fixed_deposit_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "tbl_agent_sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_insurance" ADD CONSTRAINT "tbl_product_insurance_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "tbl_agent_sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
