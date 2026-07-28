import { prisma } from "@/lib/db";
import { EditableLink } from "@/components/editable-link";
import { NewLinkForm } from "@/components/new-link-form";

export const dynamic = "force-dynamic";

export default async function AdminLinksPage() {
  const links = await prisma.helpfulLink.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold text-brand">Helpful Links</h1>
      <p className="mt-1 text-sm text-muted">Shown on every client&apos;s dashboard, in sort-order.</p>

      <div className="mt-6 space-y-3">
        {links.map((link) => (
          <EditableLink key={link.id} link={link} />
        ))}
        {links.length === 0 && <p className="text-muted">No links yet — add one below.</p>}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-brand">Add a Link</h2>
      <NewLinkForm />
    </main>
  );
}
