-- DropForeignKey
ALTER TABLE "ConsultMessage" DROP CONSTRAINT "ConsultMessage_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Share" DROP CONSTRAINT "Share_practitionerId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubId" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultMessage" ADD CONSTRAINT "ConsultMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
