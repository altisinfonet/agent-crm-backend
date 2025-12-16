-- CreateTable
CREATE TABLE "tbl_country" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "iso_code" TEXT NOT NULL,
    "phone_code" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
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
CREATE TABLE "tbl_country_currency" (
    "id" BIGSERIAL NOT NULL,
    "country_id" BIGINT NOT NULL,
    "currency_id" BIGINT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tbl_country_currency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_country_iso_code_key" ON "tbl_country"("iso_code");

-- CreateIndex
CREATE INDEX "tbl_country_name_iso_code_phone_code_status_idx" ON "tbl_country"("name", "iso_code", "phone_code", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_currency_code_key" ON "tbl_currency"("code");

-- CreateIndex
CREATE INDEX "tbl_currency_name_code_symbol_exchange_rate_idx" ON "tbl_currency"("name", "code", "symbol", "exchange_rate");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_country_currency_country_id_currency_id_key" ON "tbl_country_currency"("country_id", "currency_id");

-- CreateIndex
CREATE INDEX "tbl_admin_settings_title_idx" ON "tbl_admin_settings"("title");

-- AddForeignKey
ALTER TABLE "tbl_country_currency" ADD CONSTRAINT "tbl_country_currency_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "tbl_country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_country_currency" ADD CONSTRAINT "tbl_country_currency_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "tbl_currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
