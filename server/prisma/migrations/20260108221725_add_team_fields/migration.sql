/*
  Warnings:

  - Added the required column `ownerId` to the `Organization` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'DEACTIVATED');

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "ownerId" TEXT;

-- Backfill ownerId from existing OWNER memberships
UPDATE "Organization" o
SET "ownerId" = m."userId"
FROM "Membership" m
WHERE m."organizationId" = o."id" AND m."role" = 'OWNER';

-- Fallback: if still missing, pick any member
UPDATE "Organization" o
SET "ownerId" = m."userId"
FROM "Membership" m
WHERE o."ownerId" IS NULL AND m."organizationId" = o."id";

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
