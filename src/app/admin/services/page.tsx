import { prisma } from "@/lib/db";
import { NewServiceForm } from "@/components/new-service-form";

export const dynamic = "force-dynamic";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold text-brand">Services</h1>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-muted-2">
          <tr>
            <th className="pb-2 pr-4">Name</th>
            <th className="pb-2 pr-4">Price</th>
            <th className="pb-2 pr-4">Lessons</th>
            <th className="pb-2">Length (small/large)</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} className="border-t border-border">
              <td className="py-2 pr-4 font-medium text-foreground">{s.name}</td>
              <td className="py-2 pr-4 text-muted">{formatPrice(s.priceCents)}</td>
              <td className="py-2 pr-4 text-muted">{s.lessonCount}</td>
              <td className="py-2 text-muted">
                {s.lessonLengthMinutesSmall} / {s.lessonLengthMinutesLarge} min
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-10 text-lg font-semibold text-brand">Add a Service</h2>
      <NewServiceForm />
    </main>
  );
}
