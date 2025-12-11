-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('OWNER', 'ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('created', 'paid', 'failed');

-- CreateEnum
CREATE TYPE "RazorpaySubscriptionEventType" AS ENUM ('activated', 'charged_at', 'completed', 'halted', 'cancelled');

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "pan_number" TEXT,
    "kyc_status" BOOLEAN NOT NULL DEFAULT false,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "gst_number" TEXT,
    "pan_number" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "created_by" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationUser" (
    "id" SERIAL NOT NULL,
    "org_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "max_customers" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "billing_cycle" TEXT NOT NULL DEFAULT 'MONTHLY',
    "razorpayPlanId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "org_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "razorpaySubscriptionId" TEXT,
    "current_status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "org_id" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "aadhaar_number" TEXT,
    "pan_number" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductEntity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "product_type_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentProductEntity" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "product_entity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentProductEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductLoanTable" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "product_entity_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "loan_type" TEXT,
    "loan_amount" DOUBLE PRECISION,
    "interest_rate" DOUBLE PRECISION,
    "tenure_months" INTEGER,
    "emi_amount" DOUBLE PRECISION,
    "emi_due_day" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "collateral_details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductLoanTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSipTable" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "product_entity_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,
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

    CONSTRAINT "ProductSipTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMutualFundTable" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "product_entity_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,
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

    CONSTRAINT "ProductMutualFundTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFdTable" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "product_entity_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,
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

    CONSTRAINT "ProductFdTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInsuranceTable" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "product_entity_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "policy_number" TEXT,
    "policy_type" TEXT,
    "sum_assured" DOUBLE PRECISION,
    "premium_amount" DOUBLE PRECISION,
    "premium_frequency" TEXT,
    "issue_date" TIMESTAMP(3),
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "nominee_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductInsuranceTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RazorpayOrder" (
    "id" SERIAL NOT NULL,
    "org_id" INTEGER NOT NULL,
    "order_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'created',
    "receipt" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RazorpayOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RazorpayPayment" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "razorpay_payment_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "status" TEXT,
    "method" TEXT,
    "email" TEXT,
    "contact" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RazorpayPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RazorpaySubscriptionEvent" (
    "id" SERIAL NOT NULL,
    "razorpay_subscription_id" TEXT,
    "event_type" "RazorpaySubscriptionEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RazorpaySubscriptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationUser_org_id_user_id_key" ON "OrganizationUser"("org_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_razorpayPlanId_key" ON "SubscriptionPlan"("razorpayPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_org_id_key" ON "Subscription"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_razorpaySubscriptionId_key" ON "Subscription"("razorpaySubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductType_name_key" ON "ProductType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AgentProductEntity_agent_id_product_entity_id_key" ON "AgentProductEntity"("agent_id", "product_entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "RazorpayOrder_order_id_key" ON "RazorpayOrder"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "RazorpayPayment_razorpay_payment_id_key" ON "RazorpayPayment"("razorpay_payment_id");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationUser" ADD CONSTRAINT "OrganizationUser_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationUser" ADD CONSTRAINT "OrganizationUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationUser" ADD CONSTRAINT "OrganizationUser_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductEntity" ADD CONSTRAINT "ProductEntity_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "ProductType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentProductEntity" ADD CONSTRAINT "AgentProductEntity_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentProductEntity" ADD CONSTRAINT "AgentProductEntity_product_entity_id_fkey" FOREIGN KEY ("product_entity_id") REFERENCES "ProductEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLoanTable" ADD CONSTRAINT "ProductLoanTable_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLoanTable" ADD CONSTRAINT "ProductLoanTable_product_entity_id_fkey" FOREIGN KEY ("product_entity_id") REFERENCES "ProductEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLoanTable" ADD CONSTRAINT "ProductLoanTable_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSipTable" ADD CONSTRAINT "ProductSipTable_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSipTable" ADD CONSTRAINT "ProductSipTable_product_entity_id_fkey" FOREIGN KEY ("product_entity_id") REFERENCES "ProductEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSipTable" ADD CONSTRAINT "ProductSipTable_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMutualFundTable" ADD CONSTRAINT "ProductMutualFundTable_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMutualFundTable" ADD CONSTRAINT "ProductMutualFundTable_product_entity_id_fkey" FOREIGN KEY ("product_entity_id") REFERENCES "ProductEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMutualFundTable" ADD CONSTRAINT "ProductMutualFundTable_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFdTable" ADD CONSTRAINT "ProductFdTable_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFdTable" ADD CONSTRAINT "ProductFdTable_product_entity_id_fkey" FOREIGN KEY ("product_entity_id") REFERENCES "ProductEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFdTable" ADD CONSTRAINT "ProductFdTable_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInsuranceTable" ADD CONSTRAINT "ProductInsuranceTable_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInsuranceTable" ADD CONSTRAINT "ProductInsuranceTable_product_entity_id_fkey" FOREIGN KEY ("product_entity_id") REFERENCES "ProductEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInsuranceTable" ADD CONSTRAINT "ProductInsuranceTable_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RazorpayOrder" ADD CONSTRAINT "RazorpayOrder_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RazorpayPayment" ADD CONSTRAINT "RazorpayPayment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "RazorpayOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RazorpaySubscriptionEvent" ADD CONSTRAINT "RazorpaySubscriptionEvent_razorpay_subscription_id_fkey" FOREIGN KEY ("razorpay_subscription_id") REFERENCES "Subscription"("razorpaySubscriptionId") ON DELETE SET NULL ON UPDATE CASCADE;
