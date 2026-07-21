"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(loginAction, null);

  return (
    <main className="mx-auto max-w-sm flex-1 px-6 py-16">
      <h1 className="text-2xl font-semibold text-zinc-900">Client Login</h1>

      <form action={formAction} className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-zinc-700">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700">
          Password
          <input
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </main>
  );
}
