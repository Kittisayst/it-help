-- AlterTable
ALTER TABLE "Report" ADD COLUMN "officeLicense" TEXT;
ALTER TABLE "Report" ADD COLUMN "printers" TEXT;
ALTER TABLE "Report" ADD COLUMN "services" TEXT;
ALTER TABLE "Report" ADD COLUMN "sharedFolders" TEXT;
ALTER TABLE "Report" ADD COLUMN "startupPrograms" TEXT;
ALTER TABLE "Report" ADD COLUMN "usbDevices" TEXT;
ALTER TABLE "Report" ADD COLUMN "windowsLicense" TEXT;
ALTER TABLE "Report" ADD COLUMN "windowsUpdate" TEXT;

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "computerId" TEXT,
    "hostname" TEXT NOT NULL,
    "department" TEXT,
    "ipAddress" TEXT,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "reply" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_computerId_fkey" FOREIGN KEY ("computerId") REFERENCES "Computer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Command" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "computerId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "params" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" DATETIME,
    CONSTRAINT "Command_computerId_fkey" FOREIGN KEY ("computerId") REFERENCES "Computer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServerMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "computerId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServerMessage_computerId_fkey" FOREIGN KEY ("computerId") REFERENCES "Computer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "programPath" TEXT NOT NULL,
    "downloadUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Computer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostname" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "macAddress" TEXT,
    "osVersion" TEXT,
    "department" TEXT NOT NULL DEFAULT 'General',
    "label" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "apiKey" TEXT NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Computer" ("apiKey", "createdAt", "department", "hostname", "id", "ipAddress", "label", "lastSeenAt", "macAddress", "osVersion", "updatedAt") SELECT "apiKey", "createdAt", coalesce("department", 'General') AS "department", "hostname", "id", "ipAddress", "label", "lastSeenAt", "macAddress", "osVersion", "updatedAt" FROM "Computer";
DROP TABLE "Computer";
ALTER TABLE "new_Computer" RENAME TO "Computer";
CREATE UNIQUE INDEX "Computer_hostname_key" ON "Computer"("hostname");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Message_read_idx" ON "Message"("read");

-- CreateIndex
CREATE INDEX "Message_resolved_idx" ON "Message"("resolved");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Command_computerId_status_idx" ON "Command"("computerId", "status");

-- CreateIndex
CREATE INDEX "Command_status_idx" ON "Command"("status");

-- CreateIndex
CREATE INDEX "ServerMessage_computerId_delivered_idx" ON "ServerMessage"("computerId", "delivered");

-- CreateIndex
CREATE INDEX "Program_name_idx" ON "Program"("name");
