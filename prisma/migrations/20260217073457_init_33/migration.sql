-- CreateTable
CREATE TABLE "tbl_customer_status_history" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "old_status" "CustomerStatus" NOT NULL,
    "new_status" "CustomerStatus" NOT NULL,
    "changed_by" BIGINT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_customer_status_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tbl_customer_status_history" ADD CONSTRAINT "tbl_customer_status_history_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tbl_customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_customer_status_history" ADD CONSTRAINT "tbl_customer_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
