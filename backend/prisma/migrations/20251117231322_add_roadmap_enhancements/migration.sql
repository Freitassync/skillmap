/*
  Warnings:

  - You are about to drop the `activity_log` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "ResourceType" ADD VALUE 'project';

-- AlterTable
ALTER TABLE "roadmap_skills" ADD COLUMN     "estimated_hours" INTEGER,
ADD COLUMN     "learning_objectives" TEXT,
ADD COLUMN     "milestones" JSONB,
ADD COLUMN     "prerequisites" JSONB;

-- AlterTable
ALTER TABLE "skill_resources" ADD COLUMN     "is_free" BOOLEAN NOT NULL DEFAULT true;
