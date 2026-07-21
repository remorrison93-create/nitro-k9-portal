import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/app/actions";

export async function Nav() {
  const session = await auth();
  const role = session?.user.role;

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-brand">
          Nitro K-9
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-muted">
          <Link href="/shop" className="hover:text-brand">Programs</Link>
          {!session && (
            <>
              <Link href="/signup" className="hover:text-brand">Book an Assessment</Link>
              <Link href="/login" className="hover:text-brand">Client Login</Link>
            </>
          )}
          {session && role === "ADMIN" && <Link href="/admin" className="hover:text-brand">Admin</Link>}
          {session && role !== "ADMIN" && <Link href="/dashboard" className="hover:text-brand">Dashboard</Link>}
          {session && (
            <form action={logoutAction}>
              <button type="submit" className="text-muted hover:text-brand">
                Sign out
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
