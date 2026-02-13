-- CreateTable
CREATE TABLE "Computer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostname" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "macAddress" TEXT,
    "osVersion" TEXT,
    "department" TEXT,
    "label" TEXT,
    "apiKey" TEXT NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "computerId" TEXT NOT NULL,
    "cpuUsage" REAL NOT NULL,
    "cpuCores" INTEGER,
    "cpuSpeed" TEXT,
    "cpuTemp" REAL,
    "ramTotal" REAL NOT NULL,
    "ramUsed" REAL NOT NULL,
    "ramUsage" REAL NOT NULL,
    "diskTotal" REAL NOT NULL,
    "diskUsed" REAL NOT NULL,
    "diskUsage" REAL NOT NULL,
    "diskDetails" TEXT,
    "networkUp" BOOLEAN NOT NULL DEFAULT true,
    "networkInfo" TEXT,
    "osInfo" TEXT,
    "uptime" REAL,
    "topProcesses" TEXT,
    "eventLogs" TEXT,
    "software" TEXT,
    "antivirusStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_computerId_fkey" FOREIGN KEY ("computerId") REFERENCES "Computer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "computerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "message" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_computerId_fkey" FOREIGN KEY ("computerId") REFERENCES "Computer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Computer_hostname_key" ON "Computer"("hostname");

-- CreateIndex
CREATE INDEX "Report_computerId_createdAt_idx" ON "Report"("computerId", "createdAt");

-- CreateIndex
CREATE INDEX "Alert_computerId_createdAt_idx" ON "Alert"("computerId", "createdAt");

-- CreateIndex
CREATE INDEX "Alert_resolved_idx" ON "Alert"("resolved");
