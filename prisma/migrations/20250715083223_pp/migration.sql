/*
  Warnings:

  - You are about to drop the column `cvFileKey` on the `Candidate` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cvId]` on the table `Candidate` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "cvFileKey",
ADD COLUMN     "cvId" TEXT;

-- CreateTable
CREATE TABLE "Cv" (
    "id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "fileUrl" TEXT,
    "originalFilename" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CvChunk" (
    "id" TEXT NOT NULL,
    "chunkText" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "cvId" TEXT NOT NULL,

    CONSTRAINT "CvChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_cvId_key" ON "Candidate"("cvId");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CvChunk" ADD CONSTRAINT "CvChunk_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
