import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function ShopPage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ isAssessment: "desc" }, { lessonCount: "asc" }],
  });

  return (
    <main className="mx-auto max-w-4xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-semibold text-zinc-900">Training Programs</h1>
      <p className="mt-2 text-zinc-600">
        Every program includes a set number of lessons — 30 minutes for dogs 35 lbs and under,
        60 minutes for dogs over 35 lbs.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <div key={service.id} className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-zinc-900">{service.name}</h2>
            {service.description && (
              <p className="mt-1 text-sm text-zinc-600">{service.description}</p>
            )}
            <dl className="mt-4 space-y-1 text-sm text-zinc-700">
              <div className="flex justify-between">
                <dt>Price</dt>
                <dd className="font-medium">{formatPrice(service.priceCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Lessons included</dt>
                <dd className="font-medium">{service.lessonCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Lesson length</dt>
                <dd className="font-medium">
                  {service.lessonLengthMinutesSmall}–{service.lessonLengthMinutesLarge} min
                </dd>
              </div>
            </dl>
          </div>
        ))}
        {services.length === 0 && (
          <p className="text-zinc-500">
            No programs configured yet — add them from the admin panel.
          </p>
        )}
      </div>

      <Link
        href="/signup"
        className="mt-10 inline-block rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700"
      >
        Book your assessment to get started
      </Link>
    </main>
  );
}
