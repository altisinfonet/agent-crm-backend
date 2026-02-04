/*
  Warnings:

  - You are about to drop the column `description` on the `tbl_subscription_feature` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `tbl_subscription_feature` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `tbl_subscription_feature` table. All the data in the column will be lost.
  - You are about to drop the `tbl_subscription_plan_feature` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `plan_id` to the `tbl_subscription_feature` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `tbl_subscription_feature` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tbl_subscription_plan_feature" DROP CONSTRAINT "tbl_subscription_plan_feature_feature_id_fkey";

-- DropForeignKey
ALTER TABLE "tbl_subscription_plan_feature" DROP CONSTRAINT "tbl_subscription_plan_feature_plan_id_fkey";

-- DropIndex
DROP INDEX "tbl_subscription_feature_key_key";

-- AlterTable
ALTER TABLE "tbl_subscription_feature" DROP COLUMN "description",
DROP COLUMN "key",
DROP COLUMN "name",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "features" JSONB,
ADD COLUMN     "plan_id" BIGINT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "tbl_subscription_plan_feature";

-- AddForeignKey
ALTER TABLE "tbl_subscription_feature" ADD CONSTRAINT "tbl_subscription_feature_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "tbl_subscription_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
