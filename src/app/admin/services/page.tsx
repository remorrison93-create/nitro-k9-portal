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
      <h1 className="text-2xl font-semibold text-zinc-900">Services</h1>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-zinc-400">
          <tr>
            <th className="pb-2">Name</th>
            <th className="pb-2">Price</th>
            <th className="pb-2">Lessons</th>
            <th className="pb-2">Length (small/large)</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} className="border-t border-zinc-100">
              <td className="py-2 font-medium text-zinc-900">{s.name}</td>
              <td className="py-2">{formatPrice(s.priceCents)}</td>
              <td className="py-2">{s.lessonCount}</td>
              <td className="py-2">
                {s.lessonLengthMinutesSmall} / {s.lessonLengthMinutesLarge} min
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-10 text-lg font-semibold text-zinc-900">Add a Service</h2>
      <NewServiceForm />
    </main>
  );
}
