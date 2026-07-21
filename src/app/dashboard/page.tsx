import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const CONTRACT_LABEL: Record<string, string> = {
  NOT_SENT: "Contract not sent yet",
  SENT: "Contract sent — awaiting your signature",
  SIGNED: "Contract signed",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [enrollments, links] = await Promise.all([
    prisma.enrollment.findMany({
      where: { clientId: session.user.id },
      include: { dog: true, service: true, invoice: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.helpfulLink.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const isLead = session.user.role === "LEAD";

  return (
    <main className="mx-auto max-w-4xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold text-brand">
        Welcome, {session.user.firstName}
      </h1>
      {isLead && (
        <p className="mt-2 max-w-xl rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          You have a temporary account. Once your assessment is paid for, you&apos;ll get full
          access to the client dashboard — invoices, lesson scheduling for a full program, and
          messaging.
        </p>
      )}

      <section className="mt-8 space-y-4">
        {enrollments.map((e) => {
          const lessonsLeft = e.lessonsTotal - e.lessonsUsed;
          const canSchedule =
            e.contractStatus === "SIGNED" &&
            e.invoice?.status !== "DRAFT" &&
            e.invoice?.status !== "SENT" &&
            lessonsLeft > 0;

          return (
            <div key={e.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-brand">
                    {e.service.name} — {e.dog.name}
                  </h2>
                  <p className="text-sm text-muted">{CONTRACT_LABEL[e.contractStatus]}</p>
                </div>
                <Link
                  href={canSchedule ? `/dashboard/schedule/${e.id}` : "#"}
                  aria-disabled={!canSchedule}
                  className={`rounded-md px-4 py-2 text-sm font-medium ${
                    canSchedule
                      ? "bg-brand text-white hover:bg-brand-dark"
                      : "cursor-not-allowed bg-zinc-800 text-zinc-500"
                  }`}
                >
                  Schedule a Lesson
                </Link>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted sm:grid-cols-4">
                <Stat label="Lessons elapsed" value={e.lessonsUsed} />
                <Stat label="Lessons left" value={lessonsLeft} />
                <Stat
                  label="Balance"
                  value={
                    e.invoice
                      ? formatPrice(e.invoice.amountDueCents - e.invoice.amountPaidCents)
                      : "—"
                  }
                />
                <Stat label="Invoice status" value={e.invoice?.status ?? "—"} />
              </dl>
            </div>
          );
        })}
        {enrollments.length === 0 && (
          <p className="text-muted">No programs yet — visit the shop to get started.</p>
        )}
      </section>

      {!isLead && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand">Message Center</h2>
            <Link href="/dashboard/messages" className="text-sm font-medium text-brand underline">
              Open messages
            </Link>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-brand">Helpful Links</h2>
        <ul className="mt-3 space-y-2">
          {links.map((link) => (
            <li key={link.id}>
              <a href={link.url} className="text-sm font-medium text-brand underline">
                {link.title}
              </a>
              {link.description && (
                <p className="text-sm text-muted">{link.description}</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-2">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
