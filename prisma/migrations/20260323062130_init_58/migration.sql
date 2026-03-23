-- DropForeignKey
ALTER TABLE "tbl_agent_kyc" DROP CONSTRAINT "tbl_agent_kyc_agent_id_fkey";

-- CreateTable
CREATE TABLE "tbl_agent_profile" (
    "id" BIGSERIAL NOT NULL,
    "agent_id" BIGINT NOT NULL,
    "social_media" JSONB,
    "brand_name" TEXT NOT NULL,
    "brand_logo" TEXT NOT NULL,
    "promotional_heading" TEXT NOT NULL,
    "promotional_subheading" TEXT NOT NULL,
    "promotional_banner" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_agent_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_agent_profile_agent_id_key" ON "tbl_agent_profile"("agent_id");

-- CreateIndex
CREATE INDEX "tbl_agent_profile_brand_name_promotional_heading_promotiona_idx" ON "tbl_agent_profile"("brand_name", "promotional_heading", "promotional_subheading");

-- AddForeignKey
ALTER TABLE "tbl_agent_kyc" ADD CONSTRAINT "tbl_agent_kyc_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "tbl_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_agent_profile" ADD CONSTRAINT "tbl_agent_profile_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "tbl_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
