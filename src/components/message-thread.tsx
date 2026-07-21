"use client";

import { useActionState } from "react";
import { sendMessageAction } from "@/app/actions";

interface MessageItem {
  id: string;
  body: string;
  createdAt: string;
  senderName: string;
  fromStaff: boolean;
}

export function MessageThread({
  messages,
  threadClientId,
}: {
  messages: MessageItem[];
  threadClientId?: string;
}) {
  const [error, formAction, pending] = useActionState(sendMessageAction, null);

  return (
    <div className="mt-6">
      <div className="space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-md rounded-lg px-4 py-2 text-sm ${
              m.fromStaff ? "bg-brand text-white" : "ml-auto bg-card border border-border text-foreground"
            }`}
          >
            <p className="text-xs opacity-70">
              {m.senderName} · {new Date(m.createdAt).toLocaleString()}
            </p>
            <p className="mt-1">{m.body}</p>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-sm text-muted">No messages yet — say hello!</p>
        )}
      </div>

      <form action={formAction} className="mt-6 flex gap-2">
        {threadClientId && <input type="hidden" name="threadClientId" value={threadClientId} />}
        <input name="body" placeholder="Type a message…" required className="field-input flex-1" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
        >
          Send
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
