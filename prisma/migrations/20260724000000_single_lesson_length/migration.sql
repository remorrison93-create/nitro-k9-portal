-- Replace lessonLengthMinutesSmall/Large with a single lessonLengthMinutes: each service now
-- has exactly one lesson length (30 or 60 min) and one price, since the two lengths are priced
-- differently. Backfill from the existing "small" value before dropping the old columns, so
-- existing rows (in particular the Assessment, which was 60/60) end up with the right value
-- instead of silently resetting to a default.

ALTER TABLE "Service" ADD COLUMN "lessonLengthMinutes" INTEGER;

UPDATE "Service" SET "lessonLengthMinutes" = "lessonLengthMinutesSmall";

ALTER TABLE "Service" ALTER COLUMN "lessonLengthMinutes" SET NOT NULL;
ALTER TABLE "Service" ALTER COLUMN "lessonLengthMinutes" SET DEFAULT 30;

ALTER TABLE "Service" DROP COLUMN "lessonLengthMinutesSmall";
ALTER TABLE "Service" DROP COLUMN "lessonLengthMinutesLarge";
