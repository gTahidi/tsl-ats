/*
  Warnings:

  - You are about to drop the column `cvUrl` on the `Candidate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "cvUrl",
ADD COLUMN     "cvFileKey" TEXT;
