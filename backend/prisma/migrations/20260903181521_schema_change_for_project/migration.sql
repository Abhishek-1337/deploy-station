/*
  Warnings:

  - You are about to drop the column `repo` on the `Deployment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId]` on the table `Deployment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `repo` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Deployment_projectId_key";

-- AlterTable
ALTER TABLE "Deployment" DROP COLUMN "repo";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "repo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Deployment_projectId_key" ON "Deployment"("projectId") WHERE (status IN ('QUEUED', 'RUNNING'));
