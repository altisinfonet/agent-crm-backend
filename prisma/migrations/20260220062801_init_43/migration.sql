-- CreateTable
CREATE TABLE "tbl_product_fixed_deposit" (
    "id" BIGSERIAL NOT NULL,
    "sale_id" BIGINT NOT NULL,
    "product_type" TEXT NOT NULL,
    "scheme_name" TEXT NOT NULL,
    "account_number" BIGINT,
    "ifsc_code" TEXT,
    "bank_name" TEXT,
    "branch_name" TEXT,
    "deposit_amount" TEXT,
    "interest_rate" TEXT,
    "tenure_months" INTEGER,
    "start_date" TIMESTAMP(3),
    "maturity_date" TIMESTAMP(3),
    "maturity_amount" TEXT,
    "payout_type" TEXT,
    "nominee_name" TEXT,
    "nominee_relationship" TEXT,
    "commission_percentage" TEXT,
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
    "insurance_company_name" TEXT NOT NULL,
    "policy_number" TEXT,
    "sum_assured" TEXT,
    "premium_amount" TEXT,
    "premium_payment_frequency" TEXT,
    "policy_term_years" INTEGER,
    "policy_start_date" TIMESTAMP(3),
    "policy_end_date" TIMESTAMP(3),
    "pre_existing_diseases" TEXT,
    "smoking_status" TEXT,
    "height" TEXT,
    "weight" TEXT,
    "vehicle_type" TEXT,
    "vehicle_registration_number" TEXT,
    "vehicle_make" TEXT,
    "vehicle_model" TEXT,
    "manufacturing_year" INTEGER,
    "engine_number" TEXT,
    "chassis_number" TEXT,
    "fuel_type" TEXT,
    "cubic_capacity_cc" INTEGER,
    "insured_declared_value" TEXT,
    "no_claim_bonus" TEXT,
    "nominee_name" TEXT,
    "nominee_relationship" TEXT,
    "commission_percentage" TEXT,
    "kyc_status" TEXT,
    "proposal_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_insurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_mutual_fund" (
    "id" BIGSERIAL NOT NULL,
    "sale_id" BIGINT NOT NULL,
    "fund_type" TEXT NOT NULL,
    "fund_sub_type" TEXT,
    "amc_name" TEXT,
    "scheme_name" TEXT,
    "folio_number" TEXT,
    "investment_mode" TEXT,
    "investment_amount" TEXT,
    "sip_amount" TEXT,
    "sip_frequency" TEXT,
    "start_date" TIMESTAMP(3),
    "units_allocated" TEXT,
    "nav_at_purchase" TEXT,
    "current_value" TEXT,
    "commission_percentage" TEXT,
    "commission_amount" TEXT,
    "kyc_status" TEXT,
    "fatca_status" TEXT,
    "nominee_name" TEXT,
    "nominee_relationship" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_mutual_fund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_real_estate" (
    "id" BIGSERIAL NOT NULL,
    "sale_id" BIGINT NOT NULL,
    "property_type" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "property_title" TEXT NOT NULL,
    "property_address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "super_build_up_area_sqft" DOUBLE PRECISION,
    "build_up_area_sqft" DOUBLE PRECISION,
    "carpet_area_sqft" DOUBLE PRECISION,
    "land_area" TEXT,
    "bhk" TEXT,
    "price" TEXT,
    "booking_amount" TEXT,
    "builder_name" TEXT,
    "rera_number" TEXT,
    "ownership_type" TEXT,
    "loan_required" BOOLEAN DEFAULT false,
    "commission_percentage" TEXT,
    "commission_amount" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_real_estate_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "tbl_product_mutual_fund_sale_id_key" ON "tbl_product_mutual_fund"("sale_id");

-- CreateIndex
CREATE INDEX "tbl_product_mutual_fund_fund_type_scheme_name_idx" ON "tbl_product_mutual_fund"("fund_type", "scheme_name");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_product_real_estate_sale_id_key" ON "tbl_product_real_estate"("sale_id");

-- CreateIndex
CREATE INDEX "tbl_product_real_estate_property_type_city_idx" ON "tbl_product_real_estate"("property_type", "city");

-- AddForeignKey
ALTER TABLE "tbl_product_fixed_deposit" ADD CONSTRAINT "tbl_product_fixed_deposit_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "tbl_agent_sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_insurance" ADD CONSTRAINT "tbl_product_insurance_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "tbl_agent_sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_mutual_fund" ADD CONSTRAINT "tbl_product_mutual_fund_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "tbl_agent_sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_real_estate" ADD CONSTRAINT "tbl_product_real_estate_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "tbl_agent_sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
