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
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium text-muted">Lesson length</legend>
        <div className="mt-1 flex gap-6">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="radio" name="lessonLengthMinutes" value={30} defaultChecked />
            30 min (dogs 35 lbs and under)
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="radio" name="lessonLengthMinutes" value={60} />
            60 min (dogs over 35 lbs)
          </label>
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm font-medium text-muted sm:col-span-2">
        <input name="isAssessment" type="checkbox" />
        This is the initial assessment (applies to any dog size)
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
