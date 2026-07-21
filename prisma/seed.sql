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
