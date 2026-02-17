-- AlterTable
ALTER TABLE "tbl_customer" ADD COLUMN     "country_id" BIGINT;

-- AddForeignKey
ALTER TABLE "tbl_customer" ADD CONSTRAINT "tbl_customer_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "tbl_country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
