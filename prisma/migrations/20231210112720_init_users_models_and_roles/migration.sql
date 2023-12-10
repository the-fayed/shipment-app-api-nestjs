/*
  Warnings:

  - You are about to drop the column `mobileComfirmed` on the `Driver` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Driver` DROP COLUMN `mobileComfirmed`,
    ADD COLUMN `mobileConfirmed` BOOLEAN NOT NULL DEFAULT false;
