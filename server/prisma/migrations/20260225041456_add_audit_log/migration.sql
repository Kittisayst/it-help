-- DropIndex
DROP INDEX `Message_computerId_fkey` ON `message`;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NULL,
    `action` VARCHAR(100) NOT NULL,
    `details` TEXT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` TEXT NULL,
    `computerId` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_action_idx`(`action`),
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
