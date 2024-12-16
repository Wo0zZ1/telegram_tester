-- CreateTable
CREATE TABLE "name" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT NOT NULL,
    "group" TEXT NOT NULL,

    CONSTRAINT "name_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "nameId" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "test_completed" BOOLEAN NOT NULL DEFAULT false,
    "current_index" INTEGER NOT NULL DEFAULT 0,
    "current_rating" INTEGER NOT NULL DEFAULT 0,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "duration_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_nameId_key" ON "user"("nameId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_nameId_fkey" FOREIGN KEY ("nameId") REFERENCES "name"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
