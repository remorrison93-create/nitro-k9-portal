"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignProgramAction } from "@/app/actions";

interface Dog {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  lessonCount: number;
  lessonLengthMinutes: number;
}

export function AssignProgramForm({
  clientId,
  dogs,
  services,
}: {
  clientId: string;
  dogs: Dog[];
  services: Service[];
}) {
  const [dogId, setDogId] = useState(dogs[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (dogs.length === 0) {
    return <p className="mt-3 text-sm text-muted">This client has no dogs on file yet.</p>;
  }
  if (services.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted">
        No active services to assign — add one at /admin/services.
      </p>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await assignProgramAction(clientId, dogId, serviceId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
    >
      <label className="text-sm text-muted">
        Dog
        <select value={dogId} onChange={(e) => setDogId(e.target.value)} className="field-input mt-1">
          {dogs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-muted">
        Program
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="field-input mt-1"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.lessonCount} × {s.lessonLengthMinutes} min)
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "Assigning…" : "Assign Program"}
      </button>
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </form>
  );
}
