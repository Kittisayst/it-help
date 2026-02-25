-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(30) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'admin',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Computer` (
    `id` VARCHAR(30) NOT NULL,
    `hostname` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(45) NOT NULL,
    `macAddress` VARCHAR(50) NULL,
    `osVersion` VARCHAR(255) NULL,
    `department` VARCHAR(100) NOT NULL DEFAULT 'General',
    `label` VARCHAR(255) NULL,
    `tags` VARCHAR(500) NOT NULL DEFAULT '',
    `apiKey` VARCHAR(255) NOT NULL,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Computer_hostname_key`(`hostname`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` VARCHAR(30) NOT NULL,
    `computerId` VARCHAR(30) NOT NULL,
    `cpuUsage` DOUBLE NOT NULL,
    `cpuCores` INTEGER NULL,
    `cpuSpeed` VARCHAR(100) NULL,
    `cpuTemp` DOUBLE NULL,
    `ramTotal` DOUBLE NOT NULL,
    `ramUsed` DOUBLE NOT NULL,
    `ramUsage` DOUBLE NOT NULL,
    `diskTotal` DOUBLE NOT NULL,
    `diskUsed` DOUBLE NOT NULL,
    `diskUsage` DOUBLE NOT NULL,
    `diskDetails` LONGTEXT NULL,
    `networkUp` BOOLEAN NOT NULL DEFAULT true,
    `networkInfo` LONGTEXT NULL,
    `osInfo` TEXT NULL,
    `uptime` DOUBLE NULL,
    `topProcesses` LONGTEXT NULL,
    `eventLogs` LONGTEXT NULL,
    `software` LONGTEXT NULL,
    `antivirusStatus` TEXT NULL,
    `printers` LONGTEXT NULL,
    `windowsLicense` TEXT NULL,
    `officeLicense` TEXT NULL,
    `startupPrograms` LONGTEXT NULL,
    `sharedFolders` LONGTEXT NULL,
    `usbDevices` LONGTEXT NULL,
    `windowsUpdate` LONGTEXT NULL,
    `services` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Report_computerId_createdAt_idx`(`computerId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(30) NOT NULL,
    `computerId` VARCHAR(30) NULL,
    `hostname` VARCHAR(255) NOT NULL,
    `department` VARCHAR(100) NULL,
    `ipAddress` VARCHAR(45) NULL,
    `message` TEXT NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `resolved` BOOLEAN NOT NULL DEFAULT false,
    `resolvedAt` DATETIME(3) NULL,
    `reply` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Message_read_idx`(`read`),
    INDEX `Message_resolved_idx`(`resolved`),
    INDEX `Message_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Command` (
    `id` VARCHAR(30) NOT NULL,
    `computerId` VARCHAR(30) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `params` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `result` LONGTEXT NULL,
    `createdBy` VARCHAR(100) NOT NULL DEFAULT 'admin',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `executedAt` DATETIME(3) NULL,

    INDEX `Command_computerId_status_idx`(`computerId`, `status`),
    INDEX `Command_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Alert` (
    `id` VARCHAR(30) NOT NULL,
    `computerId` VARCHAR(30) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `severity` VARCHAR(20) NOT NULL DEFAULT 'warning',
    `message` TEXT NOT NULL,
    `resolved` BOOLEAN NOT NULL DEFAULT false,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Alert_computerId_createdAt_idx`(`computerId`, `createdAt`),
    INDEX `Alert_resolved_idx`(`resolved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServerMessage` (
    `id` VARCHAR(30) NOT NULL,
    `computerId` VARCHAR(30) NOT NULL,
    `message` TEXT NOT NULL,
    `delivered` BOOLEAN NOT NULL DEFAULT false,
    `deliveredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ServerMessage_computerId_delivered_idx`(`computerId`, `delivered`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Program` (
    `id` VARCHAR(30) NOT NULL,
    `imageUrl` VARCHAR(500) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `programPath` VARCHAR(500) NOT NULL,
    `downloadUrl` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Program_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AlertThreshold` (
    `id` VARCHAR(30) NOT NULL,
    `computerId` VARCHAR(30) NOT NULL,
    `cpuThreshold` DOUBLE NOT NULL DEFAULT 90,
    `ramThreshold` DOUBLE NOT NULL DEFAULT 85,
    `diskThreshold` DOUBLE NOT NULL DEFAULT 90,
    `eventLogErrors` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AlertThreshold_computerId_key`(`computerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `Computer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `Computer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Command` ADD CONSTRAINT `Command_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `Computer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `Computer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServerMessage` ADD CONSTRAINT `ServerMessage_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `Computer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AlertThreshold` ADD CONSTRAINT `AlertThreshold_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `Computer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
