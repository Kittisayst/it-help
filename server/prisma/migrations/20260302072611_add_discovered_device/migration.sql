-- DropIndex
DROP INDEX `auditlog_computerId_fkey` ON `auditlog`;

-- DropIndex
DROP INDEX `message_computerId_fkey` ON `message`;

-- CreateTable
CREATE TABLE `discovered_device` (
    `id` VARCHAR(30) NOT NULL,
    `ipAddress` VARCHAR(45) NOT NULL,
    `macAddress` VARCHAR(50) NULL,
    `vendor` VARCHAR(255) NULL,
    `guessedType` VARCHAR(50) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'online',
    `firstSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `scanCount` INTEGER NOT NULL DEFAULT 1,
    `isSaved` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `discovered_device_lastSeenAt_idx`(`lastSeenAt`),
    INDEX `discovered_device_isSaved_idx`(`isSaved`),
    UNIQUE INDEX `discovered_device_ipAddress_macAddress_key`(`ipAddress`, `macAddress`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `screenshot` ADD CONSTRAINT `screenshot_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `computer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report` ADD CONSTRAINT `report_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `computer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message` ADD CONSTRAINT `message_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `computer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `command` ADD CONSTRAINT `command_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `computer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alert` ADD CONSTRAINT `alert_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `computer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servermessage` ADD CONSTRAINT `servermessage_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `computer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alertthreshold` ADD CONSTRAINT `alertthreshold_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `computer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditlog` ADD CONSTRAINT `auditlog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditlog` ADD CONSTRAINT `auditlog_computerId_fkey` FOREIGN KEY (`computerId`) REFERENCES `computer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
