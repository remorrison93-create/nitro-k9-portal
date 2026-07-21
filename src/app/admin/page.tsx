import Link from "next/link";

export default function AdminHome() {
  const links = [
    { href: "/admin/services", label: "Services", desc: "Add and edit training programs and pricing." },
    { href: "/admin/clients", label: "Clients", desc: "View clients, enrollments, and account status." },
    { href: "/admin/messages", label: "Messages", desc: "Reply to client threads." },
  ];

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900">Admin</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-lg border border-zinc-200 bg-white p-5 hover:border-zinc-400"
          >
            <h2 className="font-semibold text-zinc-900">{l.label}</h2>
            <p className="mt-1 text-sm text-zinc-500">{l.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
