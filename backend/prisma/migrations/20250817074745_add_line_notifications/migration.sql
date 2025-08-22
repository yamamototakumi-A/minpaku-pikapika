-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "line_user_id" TEXT;

-- CreateTable
CREATE TABLE "public"."line_notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_line_notifications_user_id" ON "public"."line_notifications"("user_id");

-- CreateIndex
CREATE INDEX "idx_line_notifications_status" ON "public"."line_notifications"("status");

-- CreateIndex
CREATE INDEX "idx_line_notifications_sent_at" ON "public"."line_notifications"("sent_at");

-- CreateIndex
CREATE INDEX "idx_users_line_user_id" ON "public"."users"("line_user_id");

-- AddForeignKey
ALTER TABLE "public"."line_notifications" ADD CONSTRAINT "line_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
