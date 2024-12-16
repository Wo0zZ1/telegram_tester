-- AlterTable
ALTER TABLE "user" ALTER COLUMN "start_time" DROP NOT NULL,
ALTER COLUMN "end_time" DROP NOT NULL,
ALTER COLUMN "duration_time" DROP NOT NULL;
