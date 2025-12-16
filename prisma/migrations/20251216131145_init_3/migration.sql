-- CreateTable
CREATE TABLE "tbl_faqs" (
    "id" BIGSERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "rank" BIGSERIAL NOT NULL,
    "module_id" BIGINT NOT NULL DEFAULT 1,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_faq_modules" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "desc" TEXT,
    "rank" BIGSERIAL NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_faq_modules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tbl_faqs_id_question_answer_rank_status_idx" ON "tbl_faqs"("id", "question", "answer", "rank", "status");

-- CreateIndex
CREATE INDEX "tbl_faq_modules_id_name_rank_status_idx" ON "tbl_faq_modules"("id", "name", "rank", "status");

-- AddForeignKey
ALTER TABLE "tbl_faqs" ADD CONSTRAINT "tbl_faqs_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "tbl_faq_modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
