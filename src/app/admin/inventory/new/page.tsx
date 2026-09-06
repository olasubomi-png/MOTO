import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { VehicleForm } from "@/components/admin/VehicleForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Add Vehicle",
  robots: { index: false, follow: false },
};

export default async function AdminNewVehiclePage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold">
          Inventory
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Add vehicle
        </h1>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
        <VehicleForm mode="create" />
      </div>
    </div>
  );
}
