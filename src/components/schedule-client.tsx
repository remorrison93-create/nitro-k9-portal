"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bookLessonAction } from "@/app/actions";

interface Slot {
  start: string;
  end: string;
}

export function ScheduleClient({
  enrollmentId,
  lessonsLeft,
}: {
  enrollmentId: string;
  lessonsLeft: number;
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
      const result = await bookLessonAction(enrollmentId, slot);
      if (result.error) {
        setError(result.error);
      } else {
        setBooked(true);
        router.refresh();
      }
    });
  }

  if (lessonsLeft <= 0) {
    return <p className="mt-6 text-sm text-zinc-500">No lessons remaining on this program.</p>;
  }

  if (booked) {
    return (
      <p className="mt-6 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Lesson booked! Check your dashboard for details.
      </p>
    );
  }

  return (
    <div className="mt-6">
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {slots === null && <p className="text-sm text-zinc-500">Loading available times…</p>}
      {slots?.length === 0 && (
        <p className="text-sm text-zinc-500">No open slots in the next two weeks.</p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {slots?.map((slot) => (
          <button
            key={slot.start}
            disabled={pending}
            onClick={() => handleBook(slot)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:border-zinc-500 disabled:opacity-50"
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
