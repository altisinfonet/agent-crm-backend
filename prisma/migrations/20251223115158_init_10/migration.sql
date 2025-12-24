-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'POSTPONED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('REMINDER', 'FOLLOW_UP', 'CALL', 'VISIT');

-- CreateTable
CREATE TABLE "tbl_meetings" (
    "id" BIGSERIAL NOT NULL,
    "agent_id" BIGINT NOT NULL,
    "customer_id" BIGINT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "meeting_type" "MeetingType" NOT NULL DEFAULT 'REMINDER',
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "mom" TEXT,
    "reminder_before" INTEGER,
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_meetings_agent_id_start_time_status_reminder_sent_idx" ON "tbl_meetings"("agent_id", "start_time", "status", "reminder_sent");

-- AddForeignKey
ALTER TABLE "tbl_meetings" ADD CONSTRAINT "tbl_meetings_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_meetings" ADD CONSTRAINT "tbl_meetings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "tbl_customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
