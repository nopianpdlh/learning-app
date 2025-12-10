/*
  Warnings:

  - The values [PAID,COMPLETED] on the enum `EnrollmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `classId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `ForumThread` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `LiveClass` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the `Class` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentId,sectionId]` on the table `Enrollment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sectionId` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sectionId` to the `Enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sectionId` to the `ForumThread` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sectionId` to the `LiveClass` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sectionId` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sectionId` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClassType" AS ENUM ('SEMI_PRIVATE', 'PRIVATE');

-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('ACTIVE', 'FULL', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WaitingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'PRESENT', 'ABSENT');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "EnrollmentStatus_new" AS ENUM ('WAITING', 'PENDING', 'ACTIVE', 'EXPIRED', 'SLOT_RELEASED', 'CANCELLED');
ALTER TABLE "public"."Enrollment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Enrollment" ALTER COLUMN "status" TYPE "EnrollmentStatus_new" USING ("status"::text::"EnrollmentStatus_new");
ALTER TYPE "EnrollmentStatus" RENAME TO "EnrollmentStatus_old";
ALTER TYPE "EnrollmentStatus_new" RENAME TO "EnrollmentStatus";
DROP TYPE "public"."EnrollmentStatus_old";
ALTER TABLE "Enrollment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'EXPIRED';

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_classId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_tutorId_fkey";

-- DropForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_classId_fkey";

-- DropForeignKey
ALTER TABLE "ForumThread" DROP CONSTRAINT "ForumThread_classId_fkey";

-- DropForeignKey
ALTER TABLE "LiveClass" DROP CONSTRAINT "LiveClass_classId_fkey";

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_classId_fkey";

-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_classId_fkey";

-- DropIndex
DROP INDEX "Assignment_classId_idx";

-- DropIndex
DROP INDEX "Enrollment_classId_idx";

-- DropIndex
DROP INDEX "Enrollment_studentId_classId_key";

-- DropIndex
DROP INDEX "ForumThread_classId_idx";

-- DropIndex
DROP INDEX "LiveClass_classId_idx";

-- DropIndex
DROP INDEX "Material_classId_idx";

-- DropIndex
DROP INDEX "Quiz_classId_idx";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "classId",
ADD COLUMN     "sectionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "classId",
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "graceExpiryDate" TIMESTAMP(3),
ADD COLUMN     "meetingsAllowed" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "meetingsAttended" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "meetingsRemaining" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "sectionId" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "totalMeetings" INTEGER NOT NULL DEFAULT 8;

-- AlterTable
ALTER TABLE "ForumThread" DROP COLUMN "classId",
ADD COLUMN     "sectionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LiveClass" DROP COLUMN "classId",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "maxParticipants" INTEGER,
ADD COLUMN     "recordingUrl" TEXT,
ADD COLUMN     "sectionId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "Material" DROP COLUMN "classId",
ADD COLUMN     "downloadCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sectionId" TEXT NOT NULL,
ADD COLUMN     "thumbnail" TEXT,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "link" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "expiredAt" TIMESTAMP(3),
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "paymentType" TEXT,
ADD COLUMN     "redirectUrl" TEXT,
ADD COLUMN     "snapToken" TEXT,
ADD COLUMN     "transactionId" TEXT,
ADD COLUMN     "vaNumber" TEXT;

-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "classId",
ADD COLUMN     "sectionId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Class";

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "paymentId" TEXT,
    "enrollmentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "studentPhone" TEXT,
    "programName" TEXT NOT NULL,
    "sectionLabel" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassAttendance" (
    "id" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveClassAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialBookmark" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "classType" "ClassType" NOT NULL,
    "pricePerMonth" INTEGER NOT NULL,
    "maxStudentsPerSection" INTEGER NOT NULL DEFAULT 10,
    "meetingsPerPeriod" INTEGER NOT NULL DEFAULT 8,
    "periodDays" INTEGER NOT NULL DEFAULT 30,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 7,
    "thumbnail" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSection" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "sectionLabel" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "status" "SectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentEnrollments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorAvailability" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitingList" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" "WaitingStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionNote" TEXT,
    "assignedSectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledMeeting" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "meetingUrl" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdBy" TEXT NOT NULL,
    "recordingUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAttendance" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "markedBy" TEXT,
    "markedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_paymentId_key" ON "Invoice"("paymentId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_enrollmentId_idx" ON "Invoice"("enrollmentId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "LiveClassAttendance_liveClassId_idx" ON "LiveClassAttendance"("liveClassId");

-- CreateIndex
CREATE INDEX "LiveClassAttendance_studentId_idx" ON "LiveClassAttendance"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassAttendance_liveClassId_studentId_key" ON "LiveClassAttendance"("liveClassId", "studentId");

-- CreateIndex
CREATE INDEX "MaterialBookmark_studentId_idx" ON "MaterialBookmark"("studentId");

-- CreateIndex
CREATE INDEX "MaterialBookmark_materialId_idx" ON "MaterialBookmark"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialBookmark_studentId_materialId_key" ON "MaterialBookmark"("studentId", "materialId");

-- CreateIndex
CREATE INDEX "ClassTemplate_classType_idx" ON "ClassTemplate"("classType");

-- CreateIndex
CREATE INDEX "ClassTemplate_published_idx" ON "ClassTemplate"("published");

-- CreateIndex
CREATE INDEX "ClassTemplate_subject_idx" ON "ClassTemplate"("subject");

-- CreateIndex
CREATE INDEX "ClassSection_templateId_idx" ON "ClassSection"("templateId");

-- CreateIndex
CREATE INDEX "ClassSection_tutorId_idx" ON "ClassSection"("tutorId");

-- CreateIndex
CREATE INDEX "ClassSection_status_idx" ON "ClassSection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSection_templateId_sectionLabel_key" ON "ClassSection"("templateId", "sectionLabel");

-- CreateIndex
CREATE INDEX "TutorAvailability_tutorId_idx" ON "TutorAvailability"("tutorId");

-- CreateIndex
CREATE INDEX "TutorAvailability_dayOfWeek_idx" ON "TutorAvailability"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "TutorAvailability_tutorId_dayOfWeek_startTime_key" ON "TutorAvailability"("tutorId", "dayOfWeek", "startTime");

-- CreateIndex
CREATE INDEX "WaitingList_templateId_idx" ON "WaitingList"("templateId");

-- CreateIndex
CREATE INDEX "WaitingList_status_idx" ON "WaitingList"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WaitingList_studentId_templateId_key" ON "WaitingList"("studentId", "templateId");

-- CreateIndex
CREATE INDEX "ScheduledMeeting_sectionId_idx" ON "ScheduledMeeting"("sectionId");

-- CreateIndex
CREATE INDEX "ScheduledMeeting_scheduledAt_idx" ON "ScheduledMeeting"("scheduledAt");

-- CreateIndex
CREATE INDEX "ScheduledMeeting_status_idx" ON "ScheduledMeeting"("status");

-- CreateIndex
CREATE INDEX "MeetingAttendance_meetingId_idx" ON "MeetingAttendance"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingAttendance_enrollmentId_idx" ON "MeetingAttendance"("enrollmentId");

-- CreateIndex
CREATE INDEX "MeetingAttendance_status_idx" ON "MeetingAttendance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingAttendance_meetingId_enrollmentId_key" ON "MeetingAttendance"("meetingId", "enrollmentId");

-- CreateIndex
CREATE INDEX "Assignment_sectionId_idx" ON "Assignment"("sectionId");

-- CreateIndex
CREATE INDEX "Enrollment_sectionId_idx" ON "Enrollment"("sectionId");

-- CreateIndex
CREATE INDEX "Enrollment_expiryDate_idx" ON "Enrollment"("expiryDate");

-- CreateIndex
CREATE INDEX "Enrollment_graceExpiryDate_idx" ON "Enrollment"("graceExpiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_sectionId_key" ON "Enrollment"("studentId", "sectionId");

-- CreateIndex
CREATE INDEX "ForumThread_sectionId_idx" ON "ForumThread"("sectionId");

-- CreateIndex
CREATE INDEX "LiveClass_sectionId_idx" ON "LiveClass"("sectionId");

-- CreateIndex
CREATE INDEX "LiveClass_status_idx" ON "LiveClass"("status");

-- CreateIndex
CREATE INDEX "Material_sectionId_idx" ON "Material"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_transactionId_idx" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Quiz_sectionId_idx" ON "Quiz"("sectionId");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClass" ADD CONSTRAINT "LiveClass_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassAttendance" ADD CONSTRAINT "LiveClassAttendance_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "LiveClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassAttendance" ADD CONSTRAINT "LiveClassAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumThread" ADD CONSTRAINT "ForumThread_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialBookmark" ADD CONSTRAINT "MaterialBookmark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialBookmark" ADD CONSTRAINT "MaterialBookmark_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSection" ADD CONSTRAINT "ClassSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ClassTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSection" ADD CONSTRAINT "ClassSection_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorAvailability" ADD CONSTRAINT "TutorAvailability_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitingList" ADD CONSTRAINT "WaitingList_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitingList" ADD CONSTRAINT "WaitingList_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ClassTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledMeeting" ADD CONSTRAINT "ScheduledMeeting_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ClassSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "ScheduledMeeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAttendance" ADD CONSTRAINT "MeetingAttendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
