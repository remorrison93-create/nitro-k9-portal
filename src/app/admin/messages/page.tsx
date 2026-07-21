import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const recentMessages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const latestByThread = new Map<string, (typeof recentMessages)[number]>();
  for (const m of recentMessages) {
    if (!latestByThread.has(m.threadClientId)) latestByThread.set(m.threadClientId, m);
  }

  const clientIds = [...latestByThread.keys()];
  const clients = await prisma.user.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, firstName: true, lastName: true },
  });
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const threads = clientIds
    .map((id) => ({ client: clientById.get(id), latest: latestByThread.get(id)! }))
    .filter((t) => t.client);

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold text-brand">Messages</h1>
      <div className="mt-6 space-y-2">
        {threads.map(({ client, latest }) => (
          <Link
            key={client!.id}
            href={`/admin/messages/${client!.id}`}
            className="block rounded-lg border border-border bg-card p-4 hover:border-brand"
          >
            <p className="font-medium text-foreground">
              {client!.firstName} {client!.lastName}
            </p>
            <p className="mt-1 truncate text-sm text-muted">{latest.body}</p>
          </Link>
        ))}
        {threads.length === 0 && <p className="text-muted">No messages yet.</p>}
      </div>
    </main>
  );
}
