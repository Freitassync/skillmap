/*
  Warnings:

  - You are about to drop the column `skill_id` on the `skill_resources` table. All the data in the column will be lost.
  - Added the required column `roadmap_skill_id` to the `skill_resources` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `skill_resources` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "skill_resources" DROP CONSTRAINT "skill_resources_skill_id_fkey";

-- DropIndex
DROP INDEX "idx_skill_resources_skill";

-- AlterTable
ALTER TABLE "skill_resources" DROP COLUMN "skill_id",
ADD COLUMN     "roadmap_skill_id" UUID NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" VARCHAR(50) NOT NULL;

-- DropEnum
DROP TYPE "ResourceType";

-- CreateIndex
CREATE INDEX "idx_skill_resources_roadmap_skill" ON "skill_resources"("roadmap_skill_id");

-- AddForeignKey
ALTER TABLE "skill_resources" ADD CONSTRAINT "skill_resources_roadmap_skill_id_fkey" FOREIGN KEY ("roadmap_skill_id") REFERENCES "roadmap_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
