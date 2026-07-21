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
