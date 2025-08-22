-- CreateEnum
CREATE TYPE "public"."CompanyRole" AS ENUM ('headquarter', 'branch');

-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('company', 'client');

-- CreateEnum
CREATE TYPE "public"."BeforeAfter" AS ENUM ('before', 'after');

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" SERIAL NOT NULL,
    "company_id" TEXT NOT NULL,
    "role" "public"."CompanyRole",
    "address" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "surname" TEXT,
    "main_name" TEXT,
    "company_id" INTEGER,
    "role" TEXT,
    "user_id" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "address" TEXT,
    "user_type" "public"."UserType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."facilities" (
    "id" SERIAL NOT NULL,
    "facility_id" TEXT NOT NULL,
    "company_id" INTEGER,
    "name" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cleaning_records" (
    "id" SERIAL NOT NULL,
    "facility_id" INTEGER NOT NULL,
    "room_type" TEXT NOT NULL,
    "room_id" INTEGER NOT NULL,
    "cleaning_date" DATE NOT NULL,
    "before_images" TEXT[],
    "after_images" TEXT[],
    "staff_id" INTEGER,
    "status" TEXT DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cleaning_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."client_applications" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER,
    "facility_id" INTEGER,
    "room_type" TEXT NOT NULL,
    "room_id" INTEGER NOT NULL,
    "application_date" DATE NOT NULL,
    "status" TEXT DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cleaning_guidelines" (
    "id" SERIAL NOT NULL,
    "room_type" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "guideline_image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cleaning_guidelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cleaning_images" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "facility_id" INTEGER,
    "record_id" INTEGER,
    "room_type" TEXT NOT NULL,
    "before_after" "public"."BeforeAfter" NOT NULL,
    "uploader_id" INTEGER,
    "gcs_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cleaning_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_company_id_key" ON "public"."companies"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "public"."users"("user_id");

-- CreateIndex
CREATE INDEX "idx_users_company_id" ON "public"."users"("company_id");

-- CreateIndex
CREATE INDEX "idx_users_user_id" ON "public"."users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "facilities_facility_id_key" ON "public"."facilities"("facility_id");

-- CreateIndex
CREATE INDEX "idx_facilities_company_id" ON "public"."facilities"("company_id");

-- CreateIndex
CREATE INDEX "idx_cleaning_records_facility_date" ON "public"."cleaning_records"("facility_id", "cleaning_date");

-- CreateIndex
CREATE INDEX "idx_client_applications_client_id" ON "public"."client_applications"("client_id");

-- CreateIndex
CREATE INDEX "idx_cleaning_guidelines_room_type" ON "public"."cleaning_guidelines"("room_type");

-- CreateIndex
CREATE UNIQUE INDEX "cleaning_guidelines_room_type_step_number_key" ON "public"."cleaning_guidelines"("room_type", "step_number");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."facilities" ADD CONSTRAINT "facilities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_records" ADD CONSTRAINT "cleaning_records_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_records" ADD CONSTRAINT "cleaning_records_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."client_applications" ADD CONSTRAINT "client_applications_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."client_applications" ADD CONSTRAINT "client_applications_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_images" ADD CONSTRAINT "cleaning_images_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_images" ADD CONSTRAINT "cleaning_images_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_images" ADD CONSTRAINT "cleaning_images_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "public"."cleaning_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_images" ADD CONSTRAINT "cleaning_images_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
