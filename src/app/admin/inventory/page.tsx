import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getAllVehicles } from "@/lib/vehicle-repository";
import { formatPrice, formatMileage } from "@/lib/vehicle-query";
import { getVehicleImage } from "@/lib/vehicle-images";
import { InventoryRowActions } from "@/components/admin/InventoryActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Inventory",
  robots: { index: false, follow: false },
};

export default async function AdminInventoryPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const vehicles = (await getAllVehicles(true)).slice().sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            Catalogue
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} in Neon
          </p>
        </div>
        <Link
          href="/admin/inventory/new"
          className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-gold-light"
        >
          Add Vehicle
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No vehicles found.{" "}
          <Link href="/admin/inventory/new" className="text-gold">
            Create one
          </Link>
          .
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-4 lg:hidden">
            {vehicles.map((v) => {
              const img = getVehicleImage(v.images[0]);
              return (
                <article
                  key={v.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex gap-3">
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={img}
                        alt={`${v.year} ${v.make} ${v.model}`}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatPrice(v.price, v.currency)} ·{" "}
                        {formatMileage(v.mileage)}
                      </p>
                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {v.availability}
                        {v.featured ? " · Featured" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <InventoryRowActions
                      id={v.id}
                      featured={v.featured}
                      availability={v.availability}
                    />
                  </div>
                </article>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border lg:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-card text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Mileage</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {vehicles.map((v) => {
                  const img = getVehicleImage(v.images[0]);
                  return (
                    <tr key={v.id} className="align-middle">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-muted">
                            <Image
                              src={img}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                          <div>
                            <p className="font-medium">
                              {v.year} {v.make} {v.model}
                            </p>
                            {v.featured && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {formatPrice(v.price, v.currency)}
                      </td>
                      <td className="px-4 py-3">{formatMileage(v.mileage)}</td>
                      <td className="px-4 py-3 capitalize">{v.availability}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(v.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <InventoryRowActions
                          id={v.id}
                          featured={v.featured}
                          availability={v.availability}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
