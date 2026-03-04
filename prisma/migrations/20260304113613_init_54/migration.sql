/*
  Warnings:

  - Made the column `product_type` on table `tbl_agent_form_suggestions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tbl_agent_form_suggestions" ALTER COLUMN "product_type" SET NOT NULL;
