-- DropIndex
DROP INDEX `Message_computerId_fkey` ON `message`;

-- AlterTable
ALTER TABLE `computer` ADD COLUMN `group` VARCHAR(100) NOT NULL DEFAULT 'General';

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
