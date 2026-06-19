-- CreateTable
CREATE TABLE "HotTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "content" TEXT NOT NULL DEFAULT '',
    "url" TEXT,
    "tags" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PlatformContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content_entry_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "formatted" TEXT NOT NULL DEFAULT '',
    "style_rules_snapshot" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "published_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "PlatformContent_content_entry_id_fkey" FOREIGN KEY ("content_entry_id") REFERENCES "ContentEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduledPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform_content_id" TEXT NOT NULL,
    "scheduled_date" TEXT NOT NULL,
    "scheduled_time" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ScheduledPost_platform_content_id_fkey" FOREIGN KEY ("platform_content_id") REFERENCES "PlatformContent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlatformRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "constraints" TEXT NOT NULL,
    "is_preset" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContentEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hot_topic_id" TEXT,
    "daily_note_id" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ContentEntry_hot_topic_id_fkey" FOREIGN KEY ("hot_topic_id") REFERENCES "HotTopic" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContentEntry_daily_note_id_fkey" FOREIGN KEY ("daily_note_id") REFERENCES "DailyNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ContentEntry" ("body", "created_at", "daily_note_id", "id", "sequence", "title", "updated_at") SELECT "body", "created_at", "daily_note_id", "id", "sequence", "title", "updated_at" FROM "ContentEntry";
DROP TABLE "ContentEntry";
ALTER TABLE "new_ContentEntry" RENAME TO "ContentEntry";
CREATE INDEX "ContentEntry_daily_note_id_idx" ON "ContentEntry"("daily_note_id");
CREATE INDEX "ContentEntry_hot_topic_id_idx" ON "ContentEntry"("hot_topic_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PlatformContent_content_entry_id_platform_key" ON "PlatformContent"("content_entry_id", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledPost_platform_content_id_key" ON "ScheduledPost"("platform_content_id");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformRule_platform_key" ON "PlatformRule"("platform");
