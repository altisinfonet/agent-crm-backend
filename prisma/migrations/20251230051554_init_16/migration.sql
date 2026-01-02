-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "tbl_todo" (
    "id" BIGSERIAL NOT NULL,
    "org_id" BIGINT,
    "agent_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_todo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_todo_org_id_agent_id_is_completed_due_date_idx" ON "tbl_todo"("org_id", "agent_id", "is_completed", "due_date");

-- AddForeignKey
ALTER TABLE "tbl_todo" ADD CONSTRAINT "tbl_todo_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "tbl_organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_todo" ADD CONSTRAINT "tbl_todo_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "tbl_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
