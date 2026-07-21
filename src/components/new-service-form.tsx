"use client";

import { useActionState } from "react";
import { createServiceAction } from "@/app/actions";

export function NewServiceForm() {
  const [error, formAction, pending] = useActionState(createServiceAction, null);

  return (
    <form action={formAction} className="mt-4 grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
      <label className="block text-sm font-medium text-muted sm:col-span-2">
        Name
        <input name="name" required className="field-input mt-1" />
      </label>
      <label className="block text-sm font-medium text-muted sm:col-span-2">
        Description
        <input name="description" className="field-input mt-1" />
      </label>
      <label className="block text-sm font-medium text-muted">
        Price (USD)
        <input name="price" type="number" step="0.01" required className="field-input mt-1" />
      </label>
      <label className="block text-sm font-medium text-muted">
        Lesson count
        <input name="lessonCount" type="number" required className="field-input mt-1" />
      </label>
      <label className="block text-sm font-medium text-muted">
        Lesson length — small dogs (min)
        <input name="lessonLengthMinutesSmall" type="number" defaultValue={30} required className="field-input mt-1" />
      </label>
      <label className="block text-sm font-medium text-muted">
        Lesson length — large dogs (min)
        <input name="lessonLengthMinutesLarge" type="number" defaultValue={60} required className="field-input mt-1" />
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-muted">
        <input name="isAssessment" type="checkbox" />
        This is the initial assessment
      </label>

      {error && <p className="text-sm text-red-400 sm:col-span-2">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50 sm:col-span-2"
      >
        {pending ? "Saving…" : "Add Service"}
      </button>
    </form>
  );
}
