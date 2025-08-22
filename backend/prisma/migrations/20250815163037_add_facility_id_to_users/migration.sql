-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "facility_id" TEXT;

-- CreateIndex
CREATE INDEX "idx_users_facility_id" ON "public"."users"("facility_id");
