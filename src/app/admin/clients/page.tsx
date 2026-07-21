import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const clients = await prisma.user.findMany({
    where: { role: { in: ["LEAD", "CLIENT"] } },
    include: { enrollments: { include: { service: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold text-brand">Clients</h1>

      <div className="mt-6 space-y-3">
        {clients.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {c.firstName} {c.lastName}
                </p>
                <p className="text-sm text-muted">
                  {c.email} · {c.role}
                </p>
              </div>
              <Link href={`/admin/messages/${c.id}`} className="text-sm font-medium text-brand underline">
                Message
              </Link>
            </div>
            {c.enrollments.length > 0 && (
              <ul className="mt-2 text-sm text-muted">
                {c.enrollments.map((e) => (
                  <li key={e.id}>
                    {e.service.name} — {e.contractStatus} — {e.lessonsUsed}/{e.lessonsTotal} lessons used
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {clients.length === 0 && <p className="text-muted">No clients yet.</p>}
      </div>
    </main>
  );
}
