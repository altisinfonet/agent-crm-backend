-- CreateTable
CREATE TABLE "tbl_user_fcm_tokens" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_user_fcm_tokens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tbl_user_fcm_tokens" ADD CONSTRAINT "tbl_user_fcm_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
