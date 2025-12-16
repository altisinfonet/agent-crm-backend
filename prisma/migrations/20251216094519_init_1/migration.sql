-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('GOOGLE', 'APPLE', 'EMAIL_OTP', 'PHONE_OTP', 'EMAIL_PW');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('OWNER', 'ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('created', 'paid', 'failed');

-- CreateEnum
CREATE TYPE "SubscriptionCycle" AS ENUM ('WEEKLY', 'MONTHLY', 'YEARLY');

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
    "pan_number" TEXT,
    "kyc_status" BOOLEAN NOT NULL DEFAULT false,
    "refresh_token" TEXT,
    "reset_token" TEXT,
    "reset_token_exp" TIMESTAMP(3),
    "is_temporary" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_user_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "tbl_product_type" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_entity" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "product_type_id" BIGINT NOT NULL,
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
CREATE TABLE "tbl_product_loan" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "product_entity_id" BIGINT NOT NULL,
    "agent_id" BIGINT NOT NULL,
    "loan_type" TEXT,
    "loan_amount" DOUBLE PRECISION,
    "interest_rate" DOUBLE PRECISION,
    "tenure_months" INTEGER,
    "emi_amount" DOUBLE PRECISION,
    "emi_due_day" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "collateral_details" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_sip" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "product_entity_id" BIGINT NOT NULL,
    "agent_id" BIGINT NOT NULL,
    "folio_number" TEXT,
    "scheme_name" TEXT,
    "start_date" TIMESTAMP(3),
    "sip_amount" DOUBLE PRECISION,
    "frequency" TEXT,
    "tenure_months" INTEGER,
    "expected_maturity_value" DOUBLE PRECISION,
    "risk_profile" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_sip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_mutual_fund" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "product_entity_id" BIGINT NOT NULL,
    "agent_id" BIGINT NOT NULL,
    "folio_number" TEXT,
    "scheme_name" TEXT,
    "nav" DOUBLE PRECISION,
    "units" DOUBLE PRECISION,
    "investment_amount" DOUBLE PRECISION,
    "purchase_date" TIMESTAMP(3),
    "investment_type" TEXT,
    "risk_profile" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_mutual_fund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_fd" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "product_entity_id" BIGINT NOT NULL,
    "agent_id" BIGINT NOT NULL,
    "fd_number" TEXT,
    "amount" DOUBLE PRECISION,
    "interest_rate" DOUBLE PRECISION,
    "tenure_months" INTEGER,
    "start_date" TIMESTAMP(3),
    "maturity_date" TIMESTAMP(3),
    "maturity_amount" DOUBLE PRECISION,
    "payout_frequency" TEXT,
    "nominee_name" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_fd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_product_insurance" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "product_entity_id" BIGINT NOT NULL,
    "agent_id" BIGINT NOT NULL,
    "policy_number" TEXT,
    "policy_type" TEXT,
    "sum_assured" DOUBLE PRECISION,
    "premium_amount" DOUBLE PRECISION,
    "premium_frequency" TEXT,
    "issue_date" TIMESTAMP(3),
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "nominee_name" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_product_insurance_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "tbl_user_email_key" ON "tbl_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_user_reset_token_key" ON "tbl_user"("reset_token");

-- CreateIndex
CREATE INDEX "tbl_user_first_name_last_name_email_phone_no_provider_pan_n_idx" ON "tbl_user"("first_name", "last_name", "email", "phone_no", "provider", "pan_number", "kyc_status");

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
CREATE UNIQUE INDEX "tbl_product_type_name_key" ON "tbl_product_type"("name");

-- CreateIndex
CREATE INDEX "tbl_product_type_name_status_idx" ON "tbl_product_type"("name", "status");

-- CreateIndex
CREATE INDEX "tbl_product_entity_name_product_type_id_status_idx" ON "tbl_product_entity"("name", "product_type_id", "status");

-- CreateIndex
CREATE INDEX "tbl_agent_product_entity_agent_id_product_entity_id_idx" ON "tbl_agent_product_entity"("agent_id", "product_entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_agent_product_entity_agent_id_product_entity_id_key" ON "tbl_agent_product_entity"("agent_id", "product_entity_id");

-- CreateIndex
CREATE INDEX "tbl_product_loan_customer_id_product_entity_id_agent_id_loa_idx" ON "tbl_product_loan"("customer_id", "product_entity_id", "agent_id", "loan_type", "status");

-- CreateIndex
CREATE INDEX "tbl_product_sip_customer_id_product_entity_id_agent_id_sche_idx" ON "tbl_product_sip"("customer_id", "product_entity_id", "agent_id", "scheme_name", "frequency");

-- CreateIndex
CREATE INDEX "tbl_product_mutual_fund_customer_id_product_entity_id_agent_idx" ON "tbl_product_mutual_fund"("customer_id", "product_entity_id", "agent_id", "folio_number", "investment_type");

-- CreateIndex
CREATE INDEX "tbl_product_fd_customer_id_product_entity_id_agent_id_fd_nu_idx" ON "tbl_product_fd"("customer_id", "product_entity_id", "agent_id", "fd_number", "payout_frequency");

-- CreateIndex
CREATE INDEX "tbl_product_insurance_customer_id_product_entity_id_agent_i_idx" ON "tbl_product_insurance"("customer_id", "product_entity_id", "agent_id", "policy_number", "policy_type", "status");

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
ALTER TABLE "tbl_user" ADD CONSTRAINT "tbl_user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "tbl_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "tbl_customer" ADD CONSTRAINT "tbl_customer_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_customer" ADD CONSTRAINT "tbl_customer_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "tbl_organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_entity" ADD CONSTRAINT "tbl_product_entity_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "tbl_product_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_agent_product_entity" ADD CONSTRAINT "tbl_agent_product_entity_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_agent_product_entity" ADD CONSTRAINT "tbl_agent_product_entity_product_entity_id_fkey" FOREIGN KEY ("product_entity_id") REFERENCES "tbl_product_entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_loan" ADD CONSTRAINT "tbl_product_loan_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tbl_customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_loan" ADD CONSTRAINT "tbl_product_loan_product_entity_id_fkey" FOREIGN KEY ("product_entity_id") REFERENCES "tbl_product_entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_loan" ADD CONSTRAINT "tbl_product_loan_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_sip" ADD CONSTRAINT "tbl_product_sip_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tbl_customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_sip" ADD CONSTRAINT "tbl_product_sip_product_entity_id_fkey" FOREIGN KEY ("product_entity_id") REFERENCES "tbl_product_entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_sip" ADD CONSTRAINT "tbl_product_sip_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_mutual_fund" ADD CONSTRAINT "tbl_product_mutual_fund_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tbl_customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_mutual_fund" ADD CONSTRAINT "tbl_product_mutual_fund_product_entity_id_fkey" FOREIGN KEY ("product_entity_id") REFERENCES "tbl_product_entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_mutual_fund" ADD CONSTRAINT "tbl_product_mutual_fund_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_fd" ADD CONSTRAINT "tbl_product_fd_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tbl_customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_fd" ADD CONSTRAINT "tbl_product_fd_product_entity_id_fkey" FOREIGN KEY ("product_entity_id") REFERENCES "tbl_product_entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_fd" ADD CONSTRAINT "tbl_product_fd_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_insurance" ADD CONSTRAINT "tbl_product_insurance_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tbl_customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_insurance" ADD CONSTRAINT "tbl_product_insurance_product_entity_id_fkey" FOREIGN KEY ("product_entity_id") REFERENCES "tbl_product_entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_product_insurance" ADD CONSTRAINT "tbl_product_insurance_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_razorpay_order" ADD CONSTRAINT "tbl_razorpay_order_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "tbl_organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_razorpay_payment" ADD CONSTRAINT "tbl_razorpay_payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "tbl_razorpay_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_razorpay_subscription_event" ADD CONSTRAINT "tbl_razorpay_subscription_event_razorpay_subscription_id_fkey" FOREIGN KEY ("razorpay_subscription_id") REFERENCES "tbl_subscription"("razorpaySubscriptionId") ON DELETE SET NULL ON UPDATE CASCADE;
