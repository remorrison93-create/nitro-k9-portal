import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col items-start justify-center gap-6 px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
        Dog training that fits your schedule.
      </h1>
      <p className="max-w-xl text-lg text-zinc-600">
        Book your initial assessment online, sign your contract, and manage every lesson from
        one client portal — synced straight to our calendar.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Book an Assessment
        </Link>
        <Link
          href="/shop"
          className="rounded-md border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
        >
          View Programs
        </Link>
      </div>
    </main>
  );
}
