-- CreateTable
CREATE TABLE "tbl_in_app_notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "image" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_in_app_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_in_app_notifications_user_id_type_title_desc_is_read_idx" ON "tbl_in_app_notifications"("user_id", "type", "title", "desc", "is_read");

-- AddForeignKey
ALTER TABLE "tbl_in_app_notifications" ADD CONSTRAINT "tbl_in_app_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
