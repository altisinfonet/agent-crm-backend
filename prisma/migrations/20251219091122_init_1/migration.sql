-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('GOOGLE', 'APPLE', 'EMAIL_OTP', 'PHONE_OTP', 'EMAIL_PW');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('OWNER', 'ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('created', 'paid', 'failed');

-- CreateEnum
CREATE TYPE "SubscriptionCycle" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "RazorpaySubscriptionEventType" AS ENUM ('activated', 'charged_at', 'completed', 'halted', 'cancelled');

-- CreateTable
CREATE TABLE "tbl_user_session" (
    "id" BIGSERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "org_id" BIGINT,
    "device_info" JSONB,
    "ip_address" TEXT,
    "refresh_token_hash" TEXT NOT NULL,
    "refresh_token_encrypted" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tbl_user_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_role" (
    "id" BIGSERIAL NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_admin_settings" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_admin_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_country" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "iso_code" TEXT NOT NULL,
    "phoneLength" INTEGER NOT NULL,
    "phone_code" TEXT,
    "timezone" TEXT NOT NULL,
    "utc_offset_min" INTEGER NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_currency" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange_rate" DECIMAL(65,30) DEFAULT 0,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_faqs" (
    "id" BIGSERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "rank" BIGSERIAL NOT NULL,
    "module_id" BIGINT NOT NULL DEFAULT 1,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_faq_modules" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "desc" TEXT,
    "rank" BIGSERIAL NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_faq_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_dynamic_pages" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_dynamic_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_menu_types" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "parent_menu_type" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_menu_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_menu" (
    "id" BIGSERIAL NOT NULL,
    "menu_type_id" BIGINT NOT NULL,
    "menu_item_id" BIGINT NOT NULL,
    "menu_item_type" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "path" TEXT NOT NULL,
    "display_rank" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_meta_data" (
    "id" BIGSERIAL NOT NULL,
    "table_id" BIGINT NOT NULL,
    "table_name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_meta_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_user" (
    "id" BIGSERIAL NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "role_id" BIGINT NOT NULL,
    "phone_no" TEXT,
    "image" TEXT,
    "provider" "AuthType" NOT NULL,
    "provider_id" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "refresh_token" TEXT,
    "reset_token" TEXT,
    "reset_token_exp" TIMESTAMP(3),
    "country_id" BIGINT NOT NULL,
    "currency_id" BIGINT NOT NULL,
    "is_temporary" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_agent_kyc" (
    "id" BIGSERIAL NOT NULL,
    "agent_id" BIGINT NOT NULL,
    "kyc_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "pan_number" TEXT NOT NULL,
    "pan_image" TEXT NOT NULL,
    "aadhar_number" TEXT NOT NULL,
    "aadhar_image" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "branch_name" TEXT NOT NULL,
    "ifsc_code" TEXT NOT NULL,
    "upi_id" TEXT,
    "qr_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_agent_kyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_otp" (
    "id" TEXT NOT NULL,
    "credential" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "limit" INTEGER NOT NULL DEFAULT 0,
    "is_email" BOOLEAN NOT NULL DEFAULT true,
    "restrictedTime" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_invalidated_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "user_id" BIGINT NOT NULL,

    CONSTRAINT "tbl_invalidated_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_organization" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "gst_number" TEXT,
    "pan_number" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_organization_user" (
    "id" BIGSERIAL NOT NULL,
    "org_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_organization_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_subscription_plan" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "max_customers" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "billing_cycle" "SubscriptionCycle" NOT NULL DEFAULT 'MONTHLY',
    "razorpayPlanId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_subscription_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_subscription" (
    "id" BIGSERIAL NOT NULL,
    "org_id" BIGINT NOT NULL,
    "plan_id" BIGINT NOT NULL,
    "razorpaySubscriptionId" TEXT,
    "current_status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_customer" (
    "id" BIGSERIAL NOT NULL,
    "org_id" BIGINT NOT NULL,
    "created_by" BIGINT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "aadhaar_number" TEXT,
    "pan_number" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_products" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_entity" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_agent_product_entity" (
    "id" BIGSERIAL NOT NULL,
    "agent_id" BIGINT NOT NULL,
    "product_entity_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_agent_product_entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_agent_sale" (
    "id" BIGSERIAL NOT NULL,
    "org_id" BIGINT,
    "agent_id" BIGINT NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "product_entity_id" BIGINT NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_agent_sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_life_insurance" (
    "id" BIGSERIAL NOT NULL,
    "sale_id" BIGINT NOT NULL,
    "policy_number" TEXT,
    "plan_name" TEXT,
    "policy_type" TEXT,
    "sum_assured" DOUBLE PRECISION,
    "premium_amount" DOUBLE PRECISION,
    "premium_frequency" "SubscriptionCycle" DEFAULT 'MONTHLY',
    "policy_term" INTEGER,
    "payment_term" INTEGER,
    "issue_date" TIMESTAMP(3),
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "nominee_name" TEXT,
    "nominee_relation" TEXT,
    "policy_status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_life_insurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_medical_insurance" (
    "id" BIGSERIAL NOT NULL,
    "sale_id" BIGINT NOT NULL,
    "policy_number" TEXT,
    "plan_name" TEXT,
    "coverage_amount" DOUBLE PRECISION,
    "premium_amount" DOUBLE PRECISION,
    "policy_type" TEXT,
    "insured_members" JSONB,
    "pre_existing_disease" TEXT,
    "waiting_period" INTEGER,
    "issue_date" TIMESTAMP(3),
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "policy_status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_medical_insurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_mutual_fund" (
    "id" BIGSERIAL NOT NULL,
    "sale_id" BIGINT NOT NULL,
    "folio_number" TEXT,
    "scheme_name" TEXT,
    "fund_house" TEXT,
    "investment_type" TEXT,
    "investment_amount" DOUBLE PRECISION,
    "nav" DOUBLE PRECISION,
    "units" DOUBLE PRECISION,
    "sip_start_date" TIMESTAMP(3),
    "sip_end_date" TIMESTAMP(3),
    "risk_profile" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_mutual_fund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_real_estate" (
    "id" BIGSERIAL NOT NULL,
    "sale_id" BIGINT NOT NULL,
    "property_type" TEXT,
    "property_name" TEXT,
    "location" TEXT,
    "area_sqft" DOUBLE PRECISION,
    "property_value" DOUBLE PRECISION,
    "booking_amount" DOUBLE PRECISION,
    "builder_name" TEXT,
    "agreement_date" TIMESTAMP(3),
    "possession_date" TIMESTAMP(3),
    "ownership_type" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_real_estate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_razorpay_order" (
    "id" BIGSERIAL NOT NULL,
    "org_id" BIGINT NOT NULL,
    "order_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'created',
    "receipt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_razorpay_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_razorpay_payment" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "razorpay_payment_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "status" "PaymentStatus" NOT NULL DEFAULT 'created',
    "method" TEXT,
    "email" TEXT,
    "contact" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_razorpay_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_razorpay_subscription_event" (
    "id" BIGSERIAL NOT NULL,
    "razorpay_subscription_id" TEXT,
    "event_type" "RazorpaySubscriptionEventType" NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_razorpay_subscription_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_session_session_id_key" ON "tbl_user_session"("session_id");

-- CreateIndex
CREATE INDEX "tbl_user_session_session_id_user_id_org_id_ip_address_revok_idx" ON "tbl_user_session"("session_id", "user_id", "org_id", "ip_address", "revoked");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_role_name_key" ON "tbl_role"("name");

-- CreateIndex
CREATE INDEX "tbl_role_name_idx" ON "tbl_role"("name");

-- CreateIndex
CREATE INDEX "tbl_admin_settings_title_idx" ON "tbl_admin_settings"("title");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_country_iso_code_key" ON "tbl_country"("iso_code");

-- CreateIndex
CREATE INDEX "tbl_country_name_iso_code_phone_code_status_idx" ON "tbl_country"("name", "iso_code", "phone_code", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_currency_code_key" ON "tbl_currency"("code");

-- CreateIndex
CREATE INDEX "tbl_currency_name_code_symbol_exchange_rate_idx" ON "tbl_currency"("name", "code", "symbol", "exchange_rate");

-- CreateIndex
CREATE INDEX "tbl_faqs_id_question_answer_rank_status_idx" ON "tbl_faqs"("id", "question", "answer", "rank", "status");

-- CreateIndex
CREATE INDEX "tbl_faq_modules_id_name_rank_status_idx" ON "tbl_faq_modules"("id", "name", "rank", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_dynamic_pages_slug_key" ON "tbl_dynamic_pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_dynamic_pages_id_key" ON "tbl_dynamic_pages"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_menu_types_slug_key" ON "tbl_menu_types"("slug");

-- CreateIndex
CREATE INDEX "tbl_menu_types_id_idx" ON "tbl_menu_types"("id");

-- CreateIndex
CREATE INDEX "tbl_menu_id_menu_type_id_menu_item_id_path_idx" ON "tbl_menu"("id", "menu_type_id", "menu_item_id", "path");

-- CreateIndex
CREATE INDEX "tbl_meta_data_id_table_id_table_name_key_idx" ON "tbl_meta_data"("id", "table_id", "table_name", "key");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_email_key" ON "tbl_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_reset_token_key" ON "tbl_user"("reset_token");

-- CreateIndex
CREATE INDEX "tbl_user_first_name_last_name_email_phone_no_provider_count_idx" ON "tbl_user"("first_name", "last_name", "email", "phone_no", "provider", "country_id", "currency_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_agent_kyc_agent_id_key" ON "tbl_agent_kyc"("agent_id");

-- CreateIndex
CREATE INDEX "tbl_agent_kyc_pan_number_aadhar_number_bank_name_branch_nam_idx" ON "tbl_agent_kyc"("pan_number", "aadhar_number", "bank_name", "branch_name", "ifsc_code", "upi_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_otp_credential_key" ON "tbl_otp"("credential");

-- CreateIndex
CREATE INDEX "tbl_otp_credential_idx" ON "tbl_otp"("credential");

-- CreateIndex
CREATE INDEX "tbl_invalidated_tokens_user_id_idx" ON "tbl_invalidated_tokens"("user_id");

-- CreateIndex
CREATE INDEX "tbl_organization_name_gst_number_pan_number_contact_email_c_idx" ON "tbl_organization"("name", "gst_number", "pan_number", "contact_email", "contact_phone");

-- CreateIndex
CREATE INDEX "tbl_organization_user_org_id_user_id_role_id_status_idx" ON "tbl_organization_user"("org_id", "user_id", "role_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_organization_user_org_id_user_id_key" ON "tbl_organization_user"("org_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_subscription_plan_name_key" ON "tbl_subscription_plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_subscription_plan_razorpayPlanId_key" ON "tbl_subscription_plan"("razorpayPlanId");

-- CreateIndex
CREATE INDEX "tbl_subscription_plan_name_billing_cycle_razorpayPlanId_idx" ON "tbl_subscription_plan"("name", "billing_cycle", "razorpayPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_subscription_org_id_key" ON "tbl_subscription"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_subscription_razorpaySubscriptionId_key" ON "tbl_subscription"("razorpaySubscriptionId");

-- CreateIndex
CREATE INDEX "tbl_subscription_org_id_plan_id_razorpaySubscriptionId_curr_idx" ON "tbl_subscription"("org_id", "plan_id", "razorpaySubscriptionId", "current_status", "auto_renew");

-- CreateIndex
CREATE INDEX "tbl_customer_first_name_last_name_email_phone_aadhaar_numbe_idx" ON "tbl_customer"("first_name", "last_name", "email", "phone", "aadhaar_number", "pan_number");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_products_name_key" ON "tbl_products"("name");

-- CreateIndex
CREATE INDEX "tbl_products_name_status_idx" ON "tbl_products"("name", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_product_entity_slug_key" ON "tbl_product_entity"("slug");

-- CreateIndex
CREATE INDEX "tbl_product_entity_name_slug_product_id_status_idx" ON "tbl_product_entity"("name", "slug", "product_id", "status");

-- CreateIndex
CREATE INDEX "tbl_agent_product_entity_agent_id_product_entity_id_idx" ON "tbl_agent_product_entity"("agent_id", "product_entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_agent_product_entity_agent_id_product_entity_id_key" ON "tbl_agent_product_entity"("agent_id", "product_entity_id");

-- CreateIndex
CREATE INDEX "tbl_agent_sale_agent_id_customer_id_product_entity_id_sale__idx" ON "tbl_agent_sale"("agent_id", "customer_id", "product_entity_id", "sale_date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_product_life_insurance_sale_id_key" ON "tbl_product_life_insurance"("sale_id");

-- CreateIndex
CREATE INDEX "tbl_product_life_insurance_policy_number_plan_name_policy_t_idx" ON "tbl_product_life_insurance"("policy_number", "plan_name", "policy_type", "policy_status");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_product_medical_insurance_sale_id_key" ON "tbl_product_medical_insurance"("sale_id");

-- CreateIndex
CREATE INDEX "tbl_product_medical_insurance_policy_number_plan_name_polic_idx" ON "tbl_product_medical_insurance"("policy_number", "plan_name", "policy_type", "policy_status");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_product_mutual_fund_sale_id_key" ON "tbl_product_mutual_fund"("sale_id");

-- CreateIndex
CREATE INDEX "tbl_product_mutual_fund_folio_number_scheme_name_investment_idx" ON "tbl_product_mutual_fund"("folio_number", "scheme_name", "investment_type");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_product_real_estate_sale_id_key" ON "tbl_product_real_estate"("sale_id");

-- CreateIndex
CREATE INDEX "tbl_product_real_estate_property_type_location_property_nam_idx" ON "tbl_product_real_estate"("property_type", "location", "property_name", "builder_name", "ownership_type");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_razorpay_order_order_id_key" ON "tbl_razorpay_order"("order_id");

-- CreateIndex
CREATE INDEX "tbl_razorpay_order_org_id_order_id_status_idx" ON "tbl_razorpay_order"("org_id", "order_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_razorpay_payment_razorpay_payment_id_key" ON "tbl_razorpay_payment"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "tbl_razorpay_payment_order_id_razorpay_payment_id_status_me_idx" ON "tbl_razorpay_payment"("order_id", "razorpay_payment_id", "status", "method");

-- CreateIndex
CREATE INDEX "tbl_razorpay_subscription_event_razorpay_subscription_id_ev_idx" ON "tbl_razorpay_subscription_event"("razorpay_subscription_id", "event_type");

-- AddForeignKey
ALTER TABLE "tbl_user_session" ADD CONSTRAINT "tbl_user_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_faqs" ADD CONSTRAINT "tbl_faqs_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "tbl_faq_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_menu_types" ADD CONSTRAINT "tbl_menu_types_parent_menu_type_fkey" FOREIGN KEY ("parent_menu_type") REFERENCES "tbl_menu_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_menu" ADD CONSTRAINT "tbl_menu_menu_type_id_fkey" FOREIGN KEY ("menu_type_id") REFERENCES "tbl_menu_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_user" ADD CONSTRAINT "tbl_user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "tbl_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_user" ADD CONSTRAINT "tbl_user_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "tbl_country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_user" ADD CONSTRAINT "tbl_user_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "tbl_currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_agent_kyc" ADD CONSTRAINT "tbl_agent_kyc_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_invalidated_tokens" ADD CONSTRAINT "tbl_invalidated_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_organization" ADD CONSTRAINT "tbl_organization_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_organization_user" ADD CONSTRAINT "tbl_organization_user_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "tbl_organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_organization_user" ADD CONSTRAINT "tbl_organization_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_organization_user" ADD CONSTRAINT "tbl_organization_user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "tbl_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_subscription" ADD CONSTRAINT "tbl_subscription_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "tbl_organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_subscription" ADD CONSTRAINT "tbl_subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "tbl_subscription_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_customer" ADD CONSTRAINT "tbl_customer_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "tbl_organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_customer" ADD CONSTRAINT "tbl_customer_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_entity" ADD CONSTRAINT "tbl_product_entity_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tbl_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_agent_product_entity" ADD CONSTRAINT "tbl_agent_product_entity_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_agent_product_entity" ADD CONSTRAINT "tbl_agent_product_entity_product_entity_id_fkey" FOREIGN KEY ("product_entity_id") REFERENCES "tbl_product_entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_agent_sale" ADD CONSTRAINT "tbl_agent_sale_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "tbl_organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_agent_sale" ADD CONSTRAINT "tbl_agent_sale_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_agent_sale" ADD CONSTRAINT "tbl_agent_sale_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tbl_customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_agent_sale" ADD CONSTRAINT "tbl_agent_sale_product_entity_id_fkey" FOREIGN KEY ("product_entity_id") REFERENCES "tbl_product_entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_life_insurance" ADD CONSTRAINT "tbl_product_life_insurance_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "tbl_agent_sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_medical_insurance" ADD CONSTRAINT "tbl_product_medical_insurance_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "tbl_agent_sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_mutual_fund" ADD CONSTRAINT "tbl_product_mutual_fund_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "tbl_agent_sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_real_estate" ADD CONSTRAINT "tbl_product_real_estate_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "tbl_agent_sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_razorpay_order" ADD CONSTRAINT "tbl_razorpay_order_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "tbl_organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_razorpay_payment" ADD CONSTRAINT "tbl_razorpay_payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "tbl_razorpay_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_razorpay_subscription_event" ADD CONSTRAINT "tbl_razorpay_subscription_event_razorpay_subscription_id_fkey" FOREIGN KEY ("razorpay_subscription_id") REFERENCES "tbl_subscription"("razorpaySubscriptionId") ON DELETE SET NULL ON UPDATE CASCADE;
