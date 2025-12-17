-- CreateTable
CREATE TABLE "tbl_dynamic_pages" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_dynamic_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_menu_types" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "parent_menu_type" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_menu_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_menu" (
    "id" BIGSERIAL NOT NULL,
    "menu_type_id" BIGINT NOT NULL,
    "menu_item_id" BIGINT NOT NULL,
    "menu_item_type" TEXT NOT NULL,
    "status_id" BIGINT NOT NULL DEFAULT 1,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "path" TEXT NOT NULL,
    "display_rank" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl_meta_data" (
    "id" BIGSERIAL NOT NULL,
    "table_id" BIGINT NOT NULL,
    "table_name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tbl_meta_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_dynamic_pages_slug_key" ON "tbl_dynamic_pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_dynamic_pages_id_key" ON "tbl_dynamic_pages"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_menu_types_slug_key" ON "tbl_menu_types"("slug");

-- CreateIndex
CREATE INDEX "tbl_menu_types_id_idx" ON "tbl_menu_types"("id");

-- CreateIndex
CREATE INDEX "tbl_menu_id_menu_type_id_menu_item_id_path_idx" ON "tbl_menu"("id", "menu_type_id", "menu_item_id", "path");

-- CreateIndex
CREATE INDEX "tbl_meta_data_id_table_id_table_name_key_idx" ON "tbl_meta_data"("id", "table_id", "table_name", "key");

-- AddForeignKey
ALTER TABLE "tbl_menu_types" ADD CONSTRAINT "tbl_menu_types_parent_menu_type_fkey" FOREIGN KEY ("parent_menu_type") REFERENCES "tbl_menu_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl_menu" ADD CONSTRAINT "tbl_menu_menu_type_id_fkey" FOREIGN KEY ("menu_type_id") REFERENCES "tbl_menu_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
