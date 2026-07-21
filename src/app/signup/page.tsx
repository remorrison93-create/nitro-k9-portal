"use client";

import { useActionState } from "react";
import { signupAction } from "@/app/actions";

export default function SignupPage() {
  const [error, formAction, pending] = useActionState(signupAction, null);

  return (
    <main className="mx-auto max-w-md flex-1 px-6 py-16">
      <h1 className="text-2xl font-semibold text-brand">Book Your Assessment</h1>
      <p className="mt-2 text-sm text-muted">
        Create a temporary account to request your $100 initial assessment. You&apos;ll be able
        to sign your contract, pay, and pick a time — and browse our full program lineup while
        you wait.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" name="firstName" required />
          <Field label="Last name" name="lastName" required />
        </div>
        <Field label="Email" name="email" type="email" required />
        <Field label="Password" name="password" type="password" required minLength={8} />
        <Field label="Dog's name" name="dogName" required />
        <Field label="Dog's weight (lbs)" name="dogWeightLbs" type="number" required min={1} />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Create Account & Continue"}
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-medium text-muted">
      {label}
      <input name={name} type={type} {...rest} className="field-input mt-1" />
    </label>
  );
}
