"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(loginAction, null);

  return (
    <main className="mx-auto max-w-sm flex-1 px-6 py-16">
      <h1 className="text-2xl font-semibold text-brand">Client Login</h1>

      <form action={formAction} className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-muted">
          Email
          <input name="email" type="email" required className="field-input mt-1" />
        </label>
        <label className="block text-sm font-medium text-muted">
          Password
          <input name="password" type="password" required className="field-input mt-1" />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </main>
  );
}
