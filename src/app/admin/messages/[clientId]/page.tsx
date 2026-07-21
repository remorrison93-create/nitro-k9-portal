import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MessageThread } from "@/components/message-thread";

export const dynamic = "force-dynamic";

export default async function AdminThreadPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await prisma.user.findUnique({ where: { id: clientId } });
  if (!client) notFound();

  const messages = await prisma.message.findMany({
    where: { threadClientId: clientId },
    include: { sender: { select: { firstName: true, lastName: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900">
        {client.firstName} {client.lastName}
      </h1>
      <MessageThread
        threadClientId={client.id}
        messages={messages.map((m) => ({
          id: m.id,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
          senderName: `${m.sender.firstName} ${m.sender.lastName}`,
          fromStaff: m.sender.role === "ADMIN",
        }))}
      />
    </main>
  );
}
