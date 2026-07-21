import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/app/actions";

export async function Nav() {
  const session = await auth();
  const role = session?.user.role;

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Nitro K-9
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-zinc-700">
          <Link href="/shop">Programs</Link>
          {!session && (
            <>
              <Link href="/signup">Book an Assessment</Link>
              <Link href="/login">Client Login</Link>
            </>
          )}
          {session && role === "ADMIN" && <Link href="/admin">Admin</Link>}
          {session && role !== "ADMIN" && <Link href="/dashboard">Dashboard</Link>}
          {session && (
            <form action={logoutAction}>
              <button type="submit" className="text-zinc-500 hover:text-zinc-900">
                Sign out
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
