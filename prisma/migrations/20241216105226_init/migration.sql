/*
  Warnings:

  - You are about to drop the column `user_id` on the `name` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name_id]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name_id` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `user` table without a default value. This is not possible if the table is not empty.
  - Made the column `start_time` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `end_time` on table `user` required. This step will fail if there are existing NULL values in that column.
  - Made the column `duration_time` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "name" DROP CONSTRAINT "name_user_id_fkey";

-- DropIndex
DROP INDEX "name_user_id_key";

-- AlterTable
ALTER TABLE "name" DROP COLUMN "user_id";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "name_id" INTEGER NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ALTER COLUMN "start_time" SET NOT NULL,
ALTER COLUMN "end_time" SET NOT NULL,
ALTER COLUMN "duration_time" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_user_id_key" ON "user"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_name_id_key" ON "user"("name_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_name_id_fkey" FOREIGN KEY ("name_id") REFERENCES "name"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
