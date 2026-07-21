import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MessageThread } from "@/components/message-thread";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const messages = await prisma.message.findMany({
    where: { threadClientId: session.user.id },
    include: { sender: { select: { firstName: true, lastName: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold text-brand">Messages</h1>
      <MessageThread
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
