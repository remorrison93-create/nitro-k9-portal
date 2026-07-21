-- ============================================================
-- Nitro K-9 Portal — full manual database setup
-- Paste this WHOLE file into Supabase SQL Editor and run it once.
-- Combines: init migration + lesson notice/reschedule migration +
-- dog profile migration + RLS enablement + placeholder seed data,
-- in the correct order.
-- ============================================================

-- === 1) init ===
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('LEAD', 'CLIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('NOT_SENT', 'SENT', 'SIGNED');

-- CreateEnum
CREATE TYPE "WeightClass" AS ENUM ('UNDER_35', 'OVER_35');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'VOID');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'LEAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "weightLbs" INTEGER NOT NULL,
    "weightClass" "WeightClass" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "lessonCount" INTEGER NOT NULL,
    "lessonLengthMinutesSmall" INTEGER NOT NULL DEFAULT 30,
    "lessonLengthMinutesLarge" INTEGER NOT NULL DEFAULT 60,
    "isAssessment" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "contractStatus" "ContractStatus" NOT NULL DEFAULT 'NOT_SENT',
    "contractSignedAt" TIMESTAMP(3),
    "contractRef" TEXT,
    "lessonsTotal" INTEGER NOT NULL,
    "lessonsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "squareInvoiceId" TEXT,
    "amountDueCents" INTEGER NOT NULL,
    "amountPaidCents" INTEGER NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "status" "LessonStatus" NOT NULL DEFAULT 'SCHEDULED',
    "outlookEventId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "threadClientId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpfulLink" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HelpfulLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Enrollment_clientId_idx" ON "Enrollment"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_enrollmentId_key" ON "Invoice"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_squareInvoiceId_key" ON "Invoice"("squareInvoiceId");

-- CreateIndex
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_outlookEventId_key" ON "Lesson"("outlookEventId");

-- CreateIndex
CREATE INDEX "Lesson_enrollmentId_idx" ON "Lesson"("enrollmentId");

-- CreateIndex
CREATE INDEX "Message_threadClientId_idx" ON "Message"("threadClientId");

-- AddForeignKey
ALTER TABLE "Dog" ADD CONSTRAINT "Dog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- === 2) lesson_notice_actions ===
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LessonStatus" ADD VALUE 'FORFEITED';
ALTER TYPE "LessonStatus" ADD VALUE 'RESCHEDULED';

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "rescheduledToId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_rescheduledToId_key" ON "Lesson"("rescheduledToId");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_rescheduledToId_fkey" FOREIGN KEY ("rescheduledToId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- === 3) dog_profile ===
-- AlterTable
ALTER TABLE "Dog" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "photoUrl" TEXT;


-- === 4) enable_rls ===
-- Enable Row Level Security on every table, with no policies defined.
--
-- This app never talks to Supabase's PostgREST/GraphQL API or the anon key — Prisma connects
-- directly as the `postgres` role, which owns these tables and bypasses RLS by default, so
-- this has no effect on the app itself. What it does do: Supabase auto-exposes every table in
-- `public` over its REST API by default, so without RLS, anyone with the project's anon key
-- could read/write these tables directly. Enabling RLS with zero policies closes that off
-- entirely, since no policy means no access for any role that isn't the owner/bypasses RLS.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Dog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HelpfulLink" ENABLE ROW LEVEL SECURITY;

-- === 5) seed data ===
-- Manual seed for use in the Supabase SQL Editor, when `npm run db:seed` can't reach the
-- database directly (e.g. from a sandboxed dev session). Mirrors prisma/seed.ts — same fixed
-- ids, so running `npm run db:seed` later from anywhere with real connectivity is a safe no-op
-- for rows already inserted here (ON CONFLICT DO NOTHING here, upsert there).
--
-- Admin login seeded below: admin@example.com / change-me-now — change this password (or
-- delete the row and reseed) before this goes anywhere near production.

INSERT INTO "Service" (id, name, description, "priceCents", "lessonCount", "lessonLengthMinutesSmall", "lessonLengthMinutesLarge", "isAssessment", active, "createdAt", "updatedAt")
VALUES
  ('svc-assessment', 'Initial Assessment', 'Required first session before starting a training program.', 10000, 1, 60, 60, true, true, now(), now()),
  ('svc-program-3', '3-Lesson Training Program', 'Placeholder description — edit price and details in the admin panel.', 45000, 3, 30, 60, false, true, now(), now()),
  ('svc-program-7', '7-Lesson Training Program', 'Placeholder description — edit price and details in the admin panel.', 95000, 7, 30, 60, false, true, now(), now()),
  ('svc-program-14', '14-Lesson Training Program', 'Placeholder description — edit price and details in the admin panel.', 175000, 14, 30, 60, false, true, now(), now()),
  ('svc-program-28', '28-Lesson Training Program', 'Placeholder description — edit price and details in the admin panel.', 325000, 28, 30, 60, false, true, now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "HelpfulLink" (id, title, url, description, "sortOrder", "createdAt")
VALUES
  ('link-1', 'What to expect at your assessment', 'https://example.com/placeholder', 'Placeholder link — replace with real content.', 1, now())
ON CONFLICT (id) DO NOTHING;

-- password: change-me-now (bcrypt, cost 10)
INSERT INTO "User" (id, email, "passwordHash", "firstName", "lastName", role, "createdAt", "updatedAt")
VALUES
  ('admin-seed-user', 'admin@example.com', '$2b$10$Obb4FbImiglbbEbX.fSu7eelJQIP04zkkY9fIsHkRa/eCMoWyGAGu', 'Admin', 'User', 'ADMIN', now(), now())
ON CONFLICT (email) DO NOTHING;
