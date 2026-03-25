/*
  Warnings:

  - You are about to drop the column `apiStructure` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `architecture` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `erd` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `schema` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `tasks` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `techStack` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `timeline` on the `Project` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('OVERVIEW', 'TECH_STACK', 'TIMELINE', 'API_STRUCTURE', 'TASKS');

-- CreateEnum
CREATE TYPE "DiagramType" AS ENUM ('ARCHITECTURE', 'ERD', 'SEQUENCE', 'FLOWCHART');

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "apiStructure",
DROP COLUMN "architecture",
DROP COLUMN "erd",
DROP COLUMN "schema",
DROP COLUMN "tasks",
DROP COLUMN "techStack",
DROP COLUMN "timeline";

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagram" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "DiagramType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diagram_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagram" ADD CONSTRAINT "Diagram_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
