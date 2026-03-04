-- CreateTable
CREATE TABLE "tbl_agent_form_suggestions" (
    "id" BIGSERIAL NOT NULL,
    "sale_id" BIGINT NOT NULL,
    "agent_id" BIGINT NOT NULL,
    "product_type" "SaleProductType" NOT NULL,
    "field_name" TEXT NOT NULL,
    "field_value" TEXT NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 1,
    "last_used_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_agent_form_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_agent_form_suggestions_agent_id_product_type_field_name_idx" ON "tbl_agent_form_suggestions"("agent_id", "product_type", "field_name");

-- AddForeignKey
ALTER TABLE "tbl_agent_form_suggestions" ADD CONSTRAINT "tbl_agent_form_suggestions_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "tbl_agent_sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_agent_form_suggestions" ADD CONSTRAINT "tbl_agent_form_suggestions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "tbl_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
