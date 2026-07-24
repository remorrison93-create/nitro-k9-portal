import { prisma } from "@/lib/db";
import { NewServiceForm } from "@/components/new-service-form";
import { EditableService } from "@/components/editable-service";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold text-brand">Services</h1>

      <div className="mt-6 space-y-3">
        {services.map((s) => (
          <EditableService key={s.id} service={s} />
        ))}
        {services.length === 0 && <p className="text-muted">No services yet — add one below.</p>}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-brand">Add a Service</h2>
      <NewServiceForm />
    </main>
  );
}
