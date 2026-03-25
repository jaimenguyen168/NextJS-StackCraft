-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETE', 'FAILED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "techStack" JSONB,
    "schema" JSONB,
    "timeline" JSONB,
    "architecture" JSONB,
    "erd" JSONB,
    "apiStructure" JSONB,
    "tasks" JSONB,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
