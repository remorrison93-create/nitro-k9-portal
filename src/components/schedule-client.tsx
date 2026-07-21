"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bookLessonAction, rescheduleLessonAction } from "@/app/actions";

interface Slot {
  start: string;
  end: string;
}

export function ScheduleClient({
  enrollmentId,
  lessonsLeft,
  rescheduleLessonId,
}: {
  enrollmentId: string;
  lessonsLeft: number;
  rescheduleLessonId?: string;
}) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/enrollments/${enrollmentId}/availability`)
      .then((res) => res.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setError("Couldn't load available times."));
  }, [enrollmentId]);

  function handleBook(slot: Slot) {
    setError(null);
    startTransition(async () => {
      const result = rescheduleLessonId
        ? await rescheduleLessonAction(rescheduleLessonId, slot)
        : await bookLessonAction(enrollmentId, slot);
      if (result.error) {
        setError(result.error);
      } else {
        setBooked(true);
        router.refresh();
      }
    });
  }

  if (!rescheduleLessonId && lessonsLeft <= 0) {
    return <p className="mt-6 text-sm text-muted">No lessons remaining on this program.</p>;
  }

  if (booked) {
    return (
      <p className="mt-6 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        {rescheduleLessonId ? "Lesson rescheduled!" : "Lesson booked!"} Check your dashboard for
        details.
      </p>
    );
  }

  return (
    <div className="mt-6">
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {slots === null && <p className="text-sm text-muted">Loading available times…</p>}
      {slots?.length === 0 && (
        <p className="text-sm text-muted">No open slots in the next two weeks.</p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {slots?.map((slot) => (
          <button
            key={slot.start}
            disabled={pending}
            onClick={() => handleBook(slot)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:border-brand disabled:opacity-50"
          >
            {new Date(slot.start).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </button>
        ))}
      </div>
    </div>
  );
}
