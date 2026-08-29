/*
  Warnings:

  - A unique constraint covering the columns `[projectId]` on the table `Deployment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Deployment_projectId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Deployment_projectId_key" ON "Deployment"("projectId") WHERE (status IN ('QUEUED', 'RUNNING'));
