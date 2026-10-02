-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "lastReminderAt" TIMESTAMP(3),
ADD COLUMN     "remindHourly" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SentReminder" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SentReminder_key_key" ON "SentReminder"("key");
