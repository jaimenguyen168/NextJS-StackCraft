-- CreateTable
CREATE TABLE "ProjectGithubContext" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "githubUrl" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "commitSha" TEXT,
    "commitMessage" TEXT,
    "branch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectGithubContext_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectGithubContext_projectId_key" ON "ProjectGithubContext"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectGithubContext" ADD CONSTRAINT "ProjectGithubContext_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
