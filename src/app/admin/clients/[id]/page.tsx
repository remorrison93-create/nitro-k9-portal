import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EnrollmentStatusControls } from "@/components/enrollment-status-controls";
import { AssignProgramForm } from "@/components/assign-program-form";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.user.findUnique({
    where: { id },
    include: {
      dogs: true,
      enrollments: {
        include: { dog: true, service: true, invoice: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client || client.role === "ADMIN") notFound();

  const activeServices = await prisma.service.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold text-brand">
        {client.firstName} {client.lastName}
      </h1>
      <p className="text-sm text-muted">
        {client.email} · {client.role}
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-brand">Programs</h2>
        <div className="mt-3 space-y-3">
          {client.enrollments.map((e) => (
            <div key={e.id} className="rounded-lg border border-border bg-card p-4">
              <p className="font-medium text-foreground">
                {e.service.name} — {e.dog.name}
              </p>
              <p className="text-sm text-muted">
                {formatPrice(e.invoice?.amountDueCents ?? e.service.priceCents)} · {e.lessonsUsed}/
                {e.lessonsTotal} lessons used
              </p>
              <EnrollmentStatusControls
                enrollmentId={e.id}
                contractStatus={e.contractStatus}
                invoiceStatus={e.invoice?.status ?? "DRAFT"}
              />
            </div>
          ))}
          {client.enrollments.length === 0 && (
            <p className="text-muted">No programs assigned yet.</p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-brand">Assign a Program</h2>
        <AssignProgramForm clientId={client.id} dogs={client.dogs} services={activeServices} />
      </section>
    </main>
  );
}
