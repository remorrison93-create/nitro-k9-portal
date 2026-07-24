import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ isAssessment: "desc" }, { lessonCount: "asc" }],
  });

  return (
    <main className="mx-auto max-w-4xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-semibold text-brand">Training Programs</h1>
      <p className="mt-2 text-muted">
        Programs come in a 30-minute version (dogs 35 lbs and under) and a 60-minute version
        (dogs over 35 lbs) — pick the one that matches your dog.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <div key={service.id} className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-semibold text-brand">{service.name}</h2>
            {service.description && (
              <p className="mt-1 text-sm text-muted">{service.description}</p>
            )}
            <dl className="mt-4 space-y-1 text-sm text-muted">
              <div className="flex justify-between">
                <dt>Price</dt>
                <dd className="font-medium text-foreground">{formatPrice(service.priceCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Lessons included</dt>
                <dd className="font-medium text-foreground">{service.lessonCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Lesson length</dt>
                <dd className="font-medium text-foreground">{service.lessonLengthMinutes} min</dd>
              </div>
            </dl>
          </div>
        ))}
        {services.length === 0 && (
          <p className="text-muted">
            No programs configured yet — add them from the admin panel.
          </p>
        )}
      </div>

      <Link
        href="/signup"
        className="mt-10 inline-block rounded-md bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Book your assessment to get started
      </Link>
    </main>
  );
}
