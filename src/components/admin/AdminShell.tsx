import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";

export function AdminShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold tracking-tight">
              <span className="text-gold">MOTO</span>
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                Admin
              </span>
            </Link>
            <nav className="hidden items-center gap-4 text-sm sm:flex">
              <Link
                href="/admin"
                className="text-muted-foreground transition hover:text-gold"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/inventory"
                className="text-muted-foreground transition hover:text-gold"
              >
                Inventory
              </Link>
              <Link
                href="/admin/inventory/new"
                className="text-muted-foreground transition hover:text-gold"
              >
                Add vehicle
              </Link>
              <Link
                href="/"
                target="_blank"
                className="text-muted-foreground transition hover:text-gold"
              >
                Public site ↗
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">
              {username}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition hover:border-gold hover:text-gold"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto border-t border-border px-4 py-2 text-xs sm:hidden">
          <Link href="/admin" className="text-muted-foreground hover:text-gold">
            Dashboard
          </Link>
          <Link
            href="/admin/inventory"
            className="text-muted-foreground hover:text-gold"
          >
            Inventory
          </Link>
          <Link
            href="/admin/inventory/new"
            className="text-muted-foreground hover:text-gold"
          >
            Add
          </Link>
          <Link href="/" className="text-muted-foreground hover:text-gold">
            Site ↗
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
