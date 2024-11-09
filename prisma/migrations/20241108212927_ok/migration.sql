/*
  Warnings:

  - You are about to drop the column `email` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `linkedinUrl` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Persona` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "email",
DROP COLUMN "linkedinUrl",
DROP COLUMN "name";

-- AlterTable
ALTER TABLE "Persona" DROP COLUMN "notes",
ADD COLUMN     "linkedinUrl" TEXT;
