import { prisma } from "@/lib/db";
import { NewServiceForm } from "@/components/new-service-form";
import { ServiceActiveToggle } from "@/components/service-active-toggle";
import { formatPrice, formatLessonLength } from "@/lib/format";

export const dynamic = "force-dynamic";

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
            <th className="pb-2 pr-4">Length</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} className={`border-t border-border ${s.active ? "" : "opacity-50"}`}>
              <td className="py-2 pr-4 font-medium text-foreground">
                {s.name}
                {!s.active && <span className="ml-2 text-xs text-muted-2">(inactive)</span>}
              </td>
              <td className="py-2 pr-4 text-muted">{formatPrice(s.priceCents)}</td>
              <td className="py-2 pr-4 text-muted">{s.lessonCount}</td>
              <td className="py-2 pr-4 text-muted">
                {formatLessonLength(s.lessonLengthMinutesSmall, s.lessonLengthMinutesLarge)}
              </td>
              <td className="py-2">
                <ServiceActiveToggle serviceId={s.id} active={s.active} />
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
