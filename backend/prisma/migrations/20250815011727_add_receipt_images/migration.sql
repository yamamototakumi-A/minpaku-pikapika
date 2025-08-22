-- CreateTable
CREATE TABLE "public"."receipt_images" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "facility_id" INTEGER NOT NULL,
    "uploader_id" INTEGER,
    "gcs_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "year" INTEGER NOT NULL DEFAULT 0,
    "month" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "receipt_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_receipts_facility_year_month" ON "public"."receipt_images"("facility_id", "year", "month");

-- CreateIndex
CREATE INDEX "idx_receipts_company_id" ON "public"."receipt_images"("company_id");

-- AddForeignKey
ALTER TABLE "public"."receipt_images" ADD CONSTRAINT "receipt_images_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."receipt_images" ADD CONSTRAINT "receipt_images_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."receipt_images" ADD CONSTRAINT "receipt_images_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
