/*
  Warnings:

  - You are about to drop the column `link` on the `Deployment` table. All the data in the column will be lost.
  - Added the required column `projectId` to the `Deployment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repo` to the `Deployment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Deployment" DROP COLUMN "link",
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "repo" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "domain" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
