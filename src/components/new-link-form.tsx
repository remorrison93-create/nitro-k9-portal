"use client";

import { useActionState } from "react";
import { createLinkAction } from "@/app/actions";

export function NewLinkForm() {
  const [error, formAction, pending] = useActionState(createLinkAction, null);

  return (
    <form
      action={formAction}
      className="mt-4 grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2"
    >
      <label className="block text-sm font-medium text-muted sm:col-span-2">
        Title
        <input name="title" required className="field-input mt-1" />
      </label>
      <label className="block text-sm font-medium text-muted sm:col-span-2">
        URL
        <input name="url" type="url" required className="field-input mt-1" />
      </label>
      <label className="block text-sm font-medium text-muted sm:col-span-2">
        Description
        <input name="description" className="field-input mt-1" />
      </label>
      <label className="block text-sm font-medium text-muted">
        Sort order
        <input name="sortOrder" type="number" defaultValue={0} className="field-input mt-1" />
      </label>

      {error && <p className="text-sm text-red-400 sm:col-span-2">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50 sm:col-span-2"
      >
        {pending ? "Saving…" : "Add Link"}
      </button>
    </form>
  );
}
