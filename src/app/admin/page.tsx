import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getStats, getAllVehicles } from "@/lib/vehicle-repository";
import { formatPrice } from "@/lib/vehicle-query";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const stats = await getStats();
  const recent = (await getAllVehicles(true))
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 6);

  const cards = [
    { label: "Total Vehicles", value: stats.total },
    { label: "Available", value: stats.available },
    { label: "Reserved", value: stats.reserved },
    { label: "Sold", value: stats.sold },
    { label: "Featured", value: stats.featured },
    { label: "Unpublished", value: stats.unpublished },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            Overview
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/inventory/new"
            className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-gold-light"
          >
            Add Vehicle
          </Link>
          <Link
            href="/admin/inventory"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-gold hover:text-gold"
          >
            Manage Inventory
          </Link>
          <Link
            href="/"
            target="_blank"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-gold hover:text-gold"
          >
            View Public Website ↗
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {c.label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent inventory</h2>
          <Link
            href="/admin/inventory"
            className="text-sm text-gold hover:text-gold-light"
          >
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No vehicles yet.{" "}
            <Link href="/admin/inventory/new" className="text-gold">
              Add the first vehicle
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {recent.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div>
                  <p className="font-medium">
                    {v.year} {v.make} {v.model}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {v.availability} · {formatPrice(v.price, v.currency)}
                  </p>
                </div>
                <Link
                  href={`/admin/inventory/${v.id}/edit`}
                  className="text-sm text-gold hover:text-gold-light"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
