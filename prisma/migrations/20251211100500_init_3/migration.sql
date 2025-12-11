-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "UserSession" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "org_id" INTEGER,
    "device_info" JSONB,
    "ip_address" TEXT,
    "refresh_token_hash" TEXT NOT NULL,
    "refresh_token_encrypted" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" SERIAL NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_session_id_key" ON "UserSession"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "Otp_delivery_id_key" ON "Otp"("delivery_id");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
