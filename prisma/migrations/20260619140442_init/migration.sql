-- CreateTable
CREATE TABLE "DailyNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "daily_note_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ContentEntry_daily_note_id_fkey" FOREIGN KEY ("daily_note_id") REFERENCES "DailyNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlatformPublish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content_entry_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "formatted" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "published_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "PlatformPublish_content_entry_id_fkey" FOREIGN KEY ("content_entry_id") REFERENCES "ContentEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyNote_date_key" ON "DailyNote"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ContentEntry_daily_note_id_sequence_key" ON "ContentEntry"("daily_note_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformPublish_content_entry_id_platform_key" ON "PlatformPublish"("content_entry_id", "platform");
