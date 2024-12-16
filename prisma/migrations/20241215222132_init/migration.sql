/*
  Warnings:

  - You are about to drop the column `name_id` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `name` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `name` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_name_id_fkey";

-- DropIndex
DROP INDEX "user_name_id_key";

-- AlterTable
ALTER TABLE "name" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "name_id";

-- CreateIndex
CREATE UNIQUE INDEX "name_user_id_key" ON "name"("user_id");

-- AddForeignKey
ALTER TABLE "name" ADD CONSTRAINT "name_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
