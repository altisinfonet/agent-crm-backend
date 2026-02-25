/*
  Warnings:

  - The `account_number` column on the `tbl_product_fixed_deposit` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "tbl_product_fixed_deposit" DROP COLUMN "account_number",
ADD COLUMN     "account_number" BIGINT;
