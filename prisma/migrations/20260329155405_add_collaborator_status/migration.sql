-- CreateEnum
CREATE TYPE "CollaboratorStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "ProjectCollaborator" ADD COLUMN     "status" "CollaboratorStatus" NOT NULL DEFAULT 'PENDING';
