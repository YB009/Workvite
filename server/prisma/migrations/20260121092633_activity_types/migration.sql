-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'FILE_REMOVED';
ALTER TYPE "ActivityType" ADD VALUE 'COMMENT_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE 'COMMENT_REMOVED';
ALTER TYPE "ActivityType" ADD VALUE 'OBJECTIVE_ADDED';
ALTER TYPE "ActivityType" ADD VALUE 'OBJECTIVE_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE 'OBJECTIVE_REMOVED';
ALTER TYPE "ActivityType" ADD VALUE 'PROJECT_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'PROJECT_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE 'PROJECT_DELETED';
