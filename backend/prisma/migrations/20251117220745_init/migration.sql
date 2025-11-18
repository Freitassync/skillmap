-- CreateEnum
CREATE TYPE "SkillType" AS ENUM ('hard', 'soft');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('course', 'article', 'exercise', 'podcast', 'video', 'documentation', 'tutorial');

-- CreateEnum
CREATE TYPE "ResourceLevel" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "xp_level" INTEGER NOT NULL DEFAULT 1,
    "current_xp" INTEGER NOT NULL DEFAULT 0,
    "creation_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_onboarding" VARCHAR(50),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmaps" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "career_goal" TEXT NOT NULL,
    "experience" VARCHAR(50) NOT NULL,
    "percentual_progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "creation_date" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "type" "SkillType" NOT NULL,
    "category" VARCHAR(100),

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_skills" (
    "id" UUID NOT NULL,
    "roadmap_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "is_concluded" BOOLEAN NOT NULL DEFAULT false,
    "conclusion_date" TIMESTAMP,

    CONSTRAINT "roadmap_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_resources" (
    "id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "type" "ResourceType" NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "url" TEXT NOT NULL,
    "platform" VARCHAR(100),
    "level" "ResourceLevel",
    "duration" VARCHAR(50),
    "date_added" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_roadmaps_user" ON "roadmaps"("user_id");

-- CreateIndex
CREATE INDEX "idx_roadmap_skills_roadmap" ON "roadmap_skills"("roadmap_id");

-- CreateIndex
CREATE INDEX "idx_roadmap_skills_skill" ON "roadmap_skills"("skill_id");

-- CreateIndex
CREATE INDEX "idx_chat_messages_user" ON "chat_messages"("user_id");

-- CreateIndex
CREATE INDEX "idx_skill_resources_skill" ON "skill_resources"("skill_id");

-- CreateIndex
CREATE INDEX "idx_activity_log_user" ON "activity_log"("user_id");

-- AddForeignKey
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_skills" ADD CONSTRAINT "roadmap_skills_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_skills" ADD CONSTRAINT "roadmap_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_resources" ADD CONSTRAINT "skill_resources_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
