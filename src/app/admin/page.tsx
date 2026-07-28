import Link from "next/link";

export default function AdminHome() {
  const links = [
    { href: "/admin/services", label: "Services", desc: "Add and edit training programs and pricing." },
    { href: "/admin/clients", label: "Clients", desc: "Manage programs, contract/invoice status, and account state." },
    { href: "/admin/messages", label: "Messages", desc: "Reply to client threads." },
    { href: "/admin/links", label: "Helpful Links", desc: "Edit the links shown on client dashboards." },
  ];

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold text-brand">Admin</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-lg border border-border bg-card p-5 hover:border-brand"
          >
            <h2 className="font-semibold text-brand">{l.label}</h2>
            <p className="mt-1 text-sm text-muted">{l.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
