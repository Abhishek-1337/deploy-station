/*
  Warnings:

  - A unique constraint covering the columns `[projectId]` on the table `Deployment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Deployment_projectId_key";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Deployment_projectId_key" ON "Deployment"("projectId") WHERE (status IN ('QUEUED', 'RUNNING'));
