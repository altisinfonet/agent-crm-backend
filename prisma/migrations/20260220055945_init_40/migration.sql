/*
  Warnings:

  - You are about to drop the column `commission_amount` on the `tbl_product_fixed_deposit` table. All the data in the column will be lost.
  - You are about to drop the column `commission_amount` on the `tbl_product_insurance` table. All the data in the column will be lost.
  - You are about to drop the column `policy_type` on the `tbl_product_insurance` table. All the data in the column will be lost.
  - The `premium_payment_frequency` column on the `tbl_product_insurance` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `area_sqft` on the `tbl_product_real_estate` table. All the data in the column will be lost.
  - You are about to drop the column `document_status` on the `tbl_product_real_estate` table. All the data in the column will be lost.
  - Added the required column `scheme_name` to the `tbl_product_fixed_deposit` table without a default value. This is not possible if the table is not empty.
  - Made the column `insurance_company_name` on table `tbl_product_insurance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `tbl_product_real_estate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pincode` on table `tbl_product_real_estate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `property_address` on table `tbl_product_real_estate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `property_title` on table `tbl_product_real_estate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `tbl_product_real_estate` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tbl_product_fixed_deposit" DROP COLUMN "commission_amount",
ADD COLUMN     "account_number" TEXT,
ADD COLUMN     "ifsc_code" TEXT,
ADD COLUMN     "scheme_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tbl_product_insurance" DROP COLUMN "commission_amount",
DROP COLUMN "policy_type",
ADD COLUMN     "cubic_capacity_cc" INTEGER,
ADD COLUMN     "fuel_type" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "insured_declared_value" TEXT,
ADD COLUMN     "no_claim_bonus" TEXT,
ADD COLUMN     "weight" TEXT,
ALTER COLUMN "insurance_company_name" SET NOT NULL,
DROP COLUMN "premium_payment_frequency",
ADD COLUMN     "premium_payment_frequency" TEXT;

-- AlterTable
ALTER TABLE "tbl_product_real_estate" DROP COLUMN "area_sqft",
DROP COLUMN "document_status",
ADD COLUMN     "bhk" TEXT,
ADD COLUMN     "build_up_area_sqft" DOUBLE PRECISION,
ADD COLUMN     "carpet_area_sqft" DOUBLE PRECISION,
ADD COLUMN     "land_area" TEXT,
ADD COLUMN     "super_build_up_area_sqft" DOUBLE PRECISION,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "loan_required" SET DEFAULT false,
ALTER COLUMN "pincode" SET NOT NULL,
ALTER COLUMN "property_address" SET NOT NULL,
ALTER COLUMN "property_title" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL;
