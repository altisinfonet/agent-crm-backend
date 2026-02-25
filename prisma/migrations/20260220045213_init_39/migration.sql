-- AlterTable
ALTER TABLE "tbl_product_fixed_deposit" ALTER COLUMN "deposit_amount" SET DATA TYPE TEXT,
ALTER COLUMN "interest_rate" SET DATA TYPE TEXT,
ALTER COLUMN "maturity_amount" SET DATA TYPE TEXT,
ALTER COLUMN "commission_percentage" SET DATA TYPE TEXT,
ALTER COLUMN "commission_amount" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "tbl_product_insurance" ALTER COLUMN "sum_assured" SET DATA TYPE TEXT,
ALTER COLUMN "premium_amount" SET DATA TYPE TEXT,
ALTER COLUMN "commission_percentage" SET DATA TYPE TEXT,
ALTER COLUMN "commission_amount" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "tbl_product_mutual_fund" ALTER COLUMN "investment_amount" SET DATA TYPE TEXT,
ALTER COLUMN "commission_amount" SET DATA TYPE TEXT,
ALTER COLUMN "commission_percentage" SET DATA TYPE TEXT,
ALTER COLUMN "current_value" SET DATA TYPE TEXT,
ALTER COLUMN "nav_at_purchase" SET DATA TYPE TEXT,
ALTER COLUMN "sip_amount" SET DATA TYPE TEXT,
ALTER COLUMN "units_allocated" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "tbl_product_real_estate" ALTER COLUMN "booking_amount" SET DATA TYPE TEXT,
ALTER COLUMN "commission_amount" SET DATA TYPE TEXT,
ALTER COLUMN "commission_percentage" SET DATA TYPE TEXT,
ALTER COLUMN "price" SET DATA TYPE TEXT;
