import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getVehicleById } from "@/lib/vehicle-repository";
import { VehicleForm } from "@/components/admin/VehicleForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Vehicle",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function AdminEditVehiclePage({ params }: Props) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const vehicle = await getVehicleById(id);
  if (!vehicle) notFound();

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold">
          Inventory
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Edit {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">ID: {vehicle.id}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
        <VehicleForm mode="edit" vehicle={vehicle} />
      </div>
    </div>
  );
}
