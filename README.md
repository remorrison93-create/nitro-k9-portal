# Nitro K-9 Client Portal

Booking, contracts, payments, and lesson scheduling for Nitro K-9 dog training clients —
built because off-the-shelf booking tools don't model "purchased lesson credits" or
tiered lead/client accounts well.

This is an early scaffold. **Every external integration (Square, Outlook/Microsoft Graph,
email) is a typed placeholder** that logs and returns mock data instead of calling out —
see `src/lib/integrations/`. The app is fully navigable and the data model is real; you
just need a Postgres database to actually create/read records.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS
- Prisma 7 (`@prisma/adapter-pg` driver adapter) + PostgreSQL
- Auth.js / NextAuth v5, credentials provider, JWT sessions, role-based (`LEAD` / `CLIENT` / `ADMIN`)
- Server Actions for form mutations; Route Handlers under `/api/*` for anything a future
  mobile app or webhook needs to call

## How the business logic maps to code

| Requirement | Where |
|---|---|
| Services (price, program length, lesson length by dog weight) | `prisma/schema.prisma` → `Service` model, managed at `/admin/services` |
| Client dashboard (contract status, balance, dog, program, lessons left/elapsed) | `/dashboard`, `Enrollment` + `Invoice` models |
| "Can't pay or schedule until contract signed" / "must pay before scheduling" | `src/lib/booking.ts` → `bookLesson()`, the single gate every booking path goes through |
| Lesson-credit decrement per booking | Same function — creates the `Lesson` row and increments `Enrollment.lessonsUsed` in one transaction |
| 30 min (≤35 lbs) vs 60 min (>35 lbs) lesson length | `Dog.weightClass` × `Service.lessonLengthMinutesSmall/Large`, resolved in `lessonLengthFor()` |
| Outlook-backed available slots | `src/lib/integrations/outlook.ts` (placeholder), called from `/api/enrollments/[id]/availability` |
| Temporary "lead" account for first-time assessment booking | `Role.LEAD` — created by `/signup`, promoted to `Role.CLIENT` when the assessment invoice is marked paid (see the Square webhook) |
| Message center | `Message` model, `/dashboard/messages` (client) and `/admin/messages` (staff) |
| Helpful links | `HelpfulLink` model, shown on `/dashboard` |
| Reschedule/cancel a lesson (72h notice weekdays, 7 days weekends, else forfeit) | `src/lib/lesson-notice.ts` (pure policy calc, safe for client+server) + `src/lib/booking.ts` → `cancelLesson()` / `rescheduleLesson()`, surfaced on `/dashboard` under "Upcoming Lessons" / "Lesson History" |
| Dog profile photo + bio, client-editable | `Dog.photoUrl` / `Dog.bio`, `updateDogProfileAction()`, `/dashboard` "Your Dogs" section (`src/components/dog-profile.tsx`) — see note below on where the photo actually lives |

## Getting started

```bash
npm install                 # also runs `prisma generate` via postinstall
cp .env.example .env         # fill in a real DATABASE_URL at minimum
npm run db:migrate           # creates tables from prisma/schema.prisma
npm run db:seed              # placeholder services, an admin user, a helpful link
npm run dev
```

The seeded admin login is `admin@example.com` / `change-me-now` — **change this password
(or delete/reseed) before this ever goes anywhere near production.**

### No direct DB access from where you're running this?

Some environments (sandboxed dev containers, CI, etc.) can't open a raw Postgres connection —
only outbound HTTPS. If `npm run db:migrate` can't reach the database, you can bootstrap it by
hand from your database provider's SQL editor (e.g. Supabase's).

**Starting from a brand-new/empty database:** paste `prisma/manual-setup.sql` in one shot —
it's every migration plus the seed data, concatenated in order. Verified to run cleanly as a
single script (tested against a fresh Postgres instance end to end).

**Database already has some of these tables** (e.g. you ran the init migration previously and
are catching up on later features): run only what's missing, in order:

1. `prisma/migrations/20260721000000_init/migration.sql` — creates every table.
2. `prisma/migrations/20260721010000_lesson_notice_actions/migration.sql` — lesson
   reschedule/cancel/forfeit support.
3. `prisma/migrations/20260721020000_dog_profile/migration.sql` — adds `Dog.photoUrl` /
   `Dog.bio`.
4. `prisma/seed.sql` — placeholder services/admin user/link (same as `npm run db:seed`).

The seed data uses fixed ids, so running it (or `npm run db:seed`) again later from somewhere
with real connectivity is a safe no-op. Each migration only needs to run once, ever — running
the same one twice will error on the second try (tables/columns already exist), which is
expected and harmless. `manual-setup.sql` itself gets regenerated/appended to as new migrations
are added, so it always reflects the full current schema.

Without a real `DATABASE_URL`, everything not touching the database (the homepage, login
and signup forms) still renders; pages that query Prisma (`/shop`, `/dashboard`, `/admin/*`)
will 500 until a database is connected. That's expected for right now.

## What's still a placeholder, and what real work is left

1. **Square** — `SQUARE_ACCESS_TOKEN` unset ⇒ `createInvoice()` fakes an invoice and the
   webhook handler (`/api/webhooks/square`) accepts an unverified, simplified event shape.
   Real work: wire the actual Invoices API, verify webhook signatures, and — importantly —
   confirm what actually produces the "contract signed" event, since Square doesn't have a
   native e-signature product. If contracts go through a separate tool (PandaDoc, DocuSign,
   Square's own agreement flow), that tool's webhook needs to land on
   `contractStatus = SIGNED` the same way.
2. **Outlook / Microsoft Graph** — `MS_GRAPH_CLIENT_ID` unset ⇒ `getAvailableSlots()` returns
   generated 9–5 weekday mock slots and `createCalendarEvent()` returns a fake event id. Real
   work: app registration in Entra ID, application-permission OAuth (`Calendars.ReadWrite`),
   and swapping the three functions in `src/lib/integrations/outlook.ts` for real Graph calls.
3. **Email** — `EMAIL_PROVIDER_API_KEY` unset ⇒ `sendEmail()` just logs. Pick either Graph
   send-as (reuses the Outlook app registration) or a provider like Postmark/Resend.
4. **Auth** — the credentials/bcrypt provider in `src/lib/auth.ts` is a fine starting point,
   but consider swapping in a managed provider (Clerk, Auth0) before launch, particularly for
   password reset flows and account recovery. The session shape (`id/email/role/firstName/lastName`)
   is intentionally decoupled from the provider so this swap doesn't ripple through the app.
5. **Dog photos** — unlike the others, this one actually works today, no credentials needed:
   `updateDogProfileAction()` resizes the image client-side (canvas, capped at 480px) and stores
   it as a `data:` URL directly in `Dog.photoUrl`. Fine at this scale; move to real object
   storage (Supabase Storage, since a database is already there, or S3) before this needs to
   hold many/larger images — Postgres rows aren't the right place for that long-term.
6. No test suite yet.

## Deploying (Netlify)

`netlify.toml` is already set up with `@netlify/plugin-nextjs` (the official Next.js runtime).
To go live:

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project** → pick
   this repo. Build settings are picked up from `netlify.toml` automatically.
2. **Site configuration → Environment variables** — add at minimum `DATABASE_URL` and
   `AUTH_SECRET` (generate one with `npx auth secret`). Add the Square/Graph/email vars later,
   once those integrations are wired up for real.
3. Deploy. Netlify builds and gives you a live URL on every push to `main`.

Note: this repo targets Next.js 16, which is very new — if the Netlify build fails on something
framework-specific, check the [@netlify/plugin-nextjs releases](https://github.com/opennextjs/opennextjs-netlify/releases)
for compatibility notes before assuming the app code is wrong.

## Path to a mobile app

Don't build native first. In order of effort:

1. Ship this as an installable PWA (manifest + service worker) — near-zero extra work.
2. If App Store/Play Store presence is needed later, wrap the same app with **Capacitor**
   (thin native shell, least duplicate work), or build a React Native/Expo client against
   the same `/api/*` routes for a fully native feel.

## Environment variables

See `.env.example` for the full list with explanations.
