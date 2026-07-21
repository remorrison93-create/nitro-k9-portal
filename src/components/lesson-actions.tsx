"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cancelLessonAction } from "@/app/actions";
import { hasSufficientNotice, noticeDeadline } from "@/lib/lesson-notice";

export function LessonActions({
  lessonId,
  enrollmentId,
  scheduledStart,
}: {
  lessonId: string;
  enrollmentId: string;
  scheduledStart: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const start = new Date(scheduledStart);
  const sufficientNotice = hasSufficientNotice(start);
  const deadline = noticeDeadline(start);

  function handleCancel() {
    setError(null);
    const message = sufficientNotice
      ? "Cancel this lesson? Your lesson credit will be returned."
      : `This lesson is inside the notice window (the deadline to cancel or reschedule without penalty was ${deadline.toLocaleString()}). Canceling now will forfeit the lesson — no credit will be returned. Continue?`;
    if (!window.confirm(message)) return;

    startTransition(async () => {
      const result = await cancelLessonAction(lessonId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div className="flex gap-3 text-sm">
        {sufficientNotice && (
          <Link
            href={`/dashboard/schedule/${enrollmentId}?reschedule=${lessonId}`}
            className="text-brand underline"
          >
            Reschedule
          </Link>
        )}
        <button
          type="button"
          onClick={handleCancel}
          disabled={pending}
          className="text-red-400 underline disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
