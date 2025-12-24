-- CreateTable
CREATE TABLE "tbl_push_notifications" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "type" TEXT,
    "images" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_push_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_push_notifications_id_idx" ON "tbl_push_notifications"("id");
