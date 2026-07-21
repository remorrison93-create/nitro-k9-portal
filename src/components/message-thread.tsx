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
              m.fromStaff ? "bg-zinc-900 text-white" : "ml-auto bg-white border border-zinc-200"
            }`}
          >
            <p className="text-xs opacity-70">
              {m.senderName} · {new Date(m.createdAt).toLocaleString()}
            </p>
            <p className="mt-1">{m.body}</p>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500">No messages yet — say hello!</p>
        )}
      </div>

      <form action={formAction} className="mt-6 flex gap-2">
        {threadClientId && <input type="hidden" name="threadClientId" value={threadClientId} />}
        <input
          name="body"
          placeholder="Type a message…"
          required
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
