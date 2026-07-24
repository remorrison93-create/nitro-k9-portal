"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateServiceAction, setServiceActiveAction } from "@/app/actions";
import { formatPrice } from "@/lib/format";

interface Service {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  lessonCount: number;
  lessonLengthMinutes: number;
  isAssessment: boolean;
  active: boolean;
}

export function EditableService({ service }: { service: Service }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description ?? "");
  const [priceDollars, setPriceDollars] = useState((service.priceCents / 100).toString());
  const [lessonCount, setLessonCount] = useState(service.lessonCount.toString());
  const [lessonLengthMinutes, setLessonLengthMinutes] = useState(service.lessonLengthMinutes);
  const [isAssessment, setIsAssessment] = useState(service.isAssessment);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function resetFields() {
    setName(service.name);
    setDescription(service.description ?? "");
    setPriceDollars((service.priceCents / 100).toString());
    setLessonCount(service.lessonCount.toString());
    setLessonLengthMinutes(service.lessonLengthMinutes);
    setIsAssessment(service.isAssessment);
    setError(null);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateServiceAction(service.id, {
        name,
        description,
        priceDollars: Number(priceDollars),
        lessonCount: Number(lessonCount),
        lessonLengthMinutes,
        isAssessment,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  function handleToggleActive() {
    setError(null);
    if (
      service.active &&
      !window.confirm(
        "Remove this program from the shop and signup? It stays in your records — you can bring it back anytime."
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await setServiceActiveAction(service.id, !service.active);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-muted sm:col-span-2">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="field-input mt-1"
            />
          </label>
          <label className="block text-sm font-medium text-muted sm:col-span-2">
            Description
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field-input mt-1"
            />
          </label>
          <label className="block text-sm font-medium text-muted">
            Price (USD)
            <input
              type="number"
              step="0.01"
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.target.value)}
              required
              className="field-input mt-1"
            />
          </label>
          <label className="block text-sm font-medium text-muted">
            Lesson count
            <input
              type="number"
              value={lessonCount}
              onChange={(e) => setLessonCount(e.target.value)}
              required
              className="field-input mt-1"
            />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium text-muted">Lesson length</legend>
            <div className="mt-1 flex gap-6">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  checked={lessonLengthMinutes === 30}
                  onChange={() => setLessonLengthMinutes(30)}
                />
                30 min (dogs 35 lbs and under)
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  checked={lessonLengthMinutes === 60}
                  onChange={() => setLessonLengthMinutes(60)}
                />
                60 min (dogs over 35 lbs)
              </label>
            </div>
          </fieldset>
          <label className="flex items-center gap-2 text-sm font-medium text-muted sm:col-span-2">
            <input
              type="checkbox"
              checked={isAssessment}
              onChange={(e) => setIsAssessment(e.target.checked)}
            />
            This is the initial assessment (applies to any dog size)
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              resetFields();
            }}
            className="text-sm text-muted underline"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={`rounded-lg border border-border bg-card p-4 ${service.active ? "" : "opacity-50"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-foreground">
            {service.name}
            {!service.active && <span className="ml-2 text-xs text-muted-2">(inactive)</span>}
          </p>
          {service.description && <p className="mt-1 text-sm text-muted">{service.description}</p>}
          <p className="mt-2 text-sm text-muted">
            {formatPrice(service.priceCents)} · {service.lessonCount} lessons ·{" "}
            {service.lessonLengthMinutes} min
          </p>
        </div>
        <div className="flex shrink-0 gap-3 text-sm">
          <button type="button" onClick={() => setEditing(true)} className="text-brand underline">
            Edit
          </button>
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={pending}
            className={`underline disabled:opacity-50 ${service.active ? "text-red-400" : "text-brand"}`}
          >
            {service.active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
