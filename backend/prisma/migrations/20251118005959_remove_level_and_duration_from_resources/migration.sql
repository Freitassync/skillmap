/*
  Warnings:

  - You are about to drop the column `duration` on the `skill_resources` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `skill_resources` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "skill_resources" DROP COLUMN "duration",
DROP COLUMN "level";

-- DropEnum
DROP TYPE "ResourceLevel";
