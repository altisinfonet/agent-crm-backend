/*
  Warnings:

  - You are about to drop the `tbl_product_fixed_deposit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_product_insurance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_product_mutual_fund` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tbl_product_real_estate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tbl_product_fixed_deposit" DROP CONSTRAINT "tbl_product_fixed_deposit_sale_id_fkey";

-- DropForeignKey
ALTER TABLE "tbl_product_insurance" DROP CONSTRAINT "tbl_product_insurance_sale_id_fkey";

-- DropForeignKey
ALTER TABLE "tbl_product_mutual_fund" DROP CONSTRAINT "tbl_product_mutual_fund_sale_id_fkey";

-- DropForeignKey
ALTER TABLE "tbl_product_real_estate" DROP CONSTRAINT "tbl_product_real_estate_sale_id_fkey";

-- DropTable
DROP TABLE "tbl_product_fixed_deposit";

-- DropTable
DROP TABLE "tbl_product_insurance";

-- DropTable
DROP TABLE "tbl_product_mutual_fund";

-- DropTable
DROP TABLE "tbl_product_real_estate";
