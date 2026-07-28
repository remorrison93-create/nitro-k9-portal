"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLinkAction, deleteLinkAction } from "@/app/actions";

interface HelpfulLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  sortOrder: number;
}

export function EditableLink({ link }: { link: HelpfulLink }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [description, setDescription] = useState(link.description ?? "");
  const [sortOrder, setSortOrder] = useState(link.sortOrder.toString());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function resetFields() {
    setTitle(link.title);
    setUrl(link.url);
    setDescription(link.description ?? "");
    setSortOrder(link.sortOrder.toString());
    setError(null);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateLinkAction(link.id, {
        title,
        url,
        description,
        sortOrder: Number(sortOrder),
      });
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${link.title}"? This can't be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteLinkAction(link.id);
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
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="field-input mt-1"
            />
          </label>
          <label className="block text-sm font-medium text-muted sm:col-span-2">
            URL
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
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
            Sort order
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="field-input mt-1"
            />
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
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-foreground">{link.title}</p>
          <p className="text-sm text-muted">{link.url}</p>
          {link.description && <p className="mt-1 text-sm text-muted">{link.description}</p>}
        </div>
        <div className="flex shrink-0 gap-3 text-sm">
          <button type="button" onClick={() => setEditing(true)} className="text-brand underline">
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="text-red-400 underline disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
