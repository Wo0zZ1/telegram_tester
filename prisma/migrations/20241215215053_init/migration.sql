/*
  Warnings:

  - You are about to drop the column `nameId` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name_id]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name_id` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_nameId_fkey";

-- DropIndex
DROP INDEX "user_nameId_key";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "nameId",
ADD COLUMN     "name_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_name_id_key" ON "user"("name_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_name_id_fkey" FOREIGN KEY ("name_id") REFERENCES "name"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
