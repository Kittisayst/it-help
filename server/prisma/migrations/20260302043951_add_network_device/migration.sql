/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Message_computerId_fkey` ON `message`;

-- AlterTable
ALTER TABLE `report` ADD COLUMN `appUsage` LONGTEXT NULL,
    ADD COLUMN `bandwidthUsage` TEXT NULL,
    ADD COLUMN `printHistory` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `updatedAt`;

-- CreateTable
CREATE TABLE `screenshot` (
    `id` VARCHAR(30) NOT NULL,
    `computerId` VARCHAR(30) NOT NULL,
    `imagePath` VARCHAR(500) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `screenshot_computerId_createdAt_idx`(`computerId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `network_device` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(45) NOT NULL,
    `macAddress` VARCHAR(50) NULL,
    `type` VARCHAR(50) NOT NULL,
    `brand` VARCHAR(100) NULL,
    `model` VARCHAR(100) NULL,
    `location` VARCHAR(255) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'online',
    `notes` TEXT NULL,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `network_device_type_idx`(`type`),
    INDEX `network_device_status_idx`(`status`),
    INDEX `network_device_ipAddress_idx`(`ipAddress`),
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

-- RenameIndex
ALTER TABLE `alert` RENAME INDEX `Alert_computerId_createdAt_idx` TO `alert_computerId_createdAt_idx`;

-- RenameIndex
ALTER TABLE `alert` RENAME INDEX `Alert_resolved_idx` TO `alert_resolved_idx`;

-- RenameIndex
ALTER TABLE `alertthreshold` RENAME INDEX `AlertThreshold_computerId_key` TO `alertthreshold_computerId_key`;

-- RenameIndex
ALTER TABLE `auditlog` RENAME INDEX `AuditLog_action_idx` TO `auditlog_action_idx`;

-- RenameIndex
ALTER TABLE `auditlog` RENAME INDEX `AuditLog_createdAt_idx` TO `auditlog_createdAt_idx`;

-- RenameIndex
ALTER TABLE `auditlog` RENAME INDEX `AuditLog_userId_idx` TO `auditlog_userId_idx`;

-- RenameIndex
ALTER TABLE `command` RENAME INDEX `Command_computerId_status_idx` TO `command_computerId_status_idx`;

-- RenameIndex
ALTER TABLE `command` RENAME INDEX `Command_status_idx` TO `command_status_idx`;

-- RenameIndex
ALTER TABLE `computer` RENAME INDEX `Computer_hostname_key` TO `computer_hostname_key`;

-- RenameIndex
ALTER TABLE `message` RENAME INDEX `Message_createdAt_idx` TO `message_createdAt_idx`;

-- RenameIndex
ALTER TABLE `message` RENAME INDEX `Message_read_idx` TO `message_read_idx`;

-- RenameIndex
ALTER TABLE `message` RENAME INDEX `Message_resolved_idx` TO `message_resolved_idx`;

-- RenameIndex
ALTER TABLE `program` RENAME INDEX `Program_name_idx` TO `program_name_idx`;

-- RenameIndex
ALTER TABLE `report` RENAME INDEX `Report_computerId_createdAt_idx` TO `report_computerId_createdAt_idx`;

-- RenameIndex
ALTER TABLE `servermessage` RENAME INDEX `ServerMessage_computerId_delivered_idx` TO `servermessage_computerId_delivered_idx`;

-- RenameIndex
ALTER TABLE `user` RENAME INDEX `User_username_key` TO `user_username_key`;
