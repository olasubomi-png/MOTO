"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Vehicle } from "@/lib/vehicle-types";
import {
  createVehicleAction,
  updateVehicleAction,
  type ActionResult,
} from "@/app/admin/actions";

type Props = {
  mode: "create" | "edit";
  vehicle?: Vehicle;
};

const initial: ActionResult | null = null;

export function VehicleForm({ mode, vehicle }: Props) {
  const router = useRouter();
  const action = mode === "create" ? createVehicleAction : updateVehicleAction;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state?.ok && state.id) {
      router.push(`/admin/inventory/${state.id}/edit`);
      router.refresh();
    }
  }, [state, router]);

  const imagesValue = vehicle?.images?.join("\n") ?? "";
  const featuresValue = vehicle?.features?.join("\n") ?? "";

  return (
    <form action={formAction} className="space-y-8">
      {mode === "edit" && vehicle && (
        <>
          <input type="hidden" name="id" value={vehicle.id} />
          <input
            type="hidden"
            name="expectedUpdatedAt"
            value={vehicle.updatedAt}
          />
        </>
      )}

      {state && !state.ok && state.error && (
        <p
          role="alert"
          className={`rounded-lg border px-3 py-2 text-sm ${
            state.conflict
              ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {state.error}
        </p>
      )}

      {state?.ok && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Saved successfully.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Make" name="make" required defaultValue={vehicle?.make} />
        <Field
          label="Model"
          name="model"
          required
          defaultValue={vehicle?.model}
        />
        <Field
          label="Year"
          name="year"
          type="number"
          required
          defaultValue={vehicle?.year?.toString()}
        />
        <Field
          label="Price (major units)"
          name="price"
          type="number"
          required
          defaultValue={vehicle?.price?.toString()}
        />
        <Field
          label="Currency"
          name="currency"
          required
          defaultValue={vehicle?.currency ?? "USD"}
        />
        <Field
          label="Mileage (km)"
          name="mileage"
          type="number"
          required
          defaultValue={vehicle?.mileage?.toString() ?? "0"}
        />
        <Field label="Fuel" name="fuel" required defaultValue={vehicle?.fuel} />
        <Field
          label="Transmission"
          name="transmission"
          required
          defaultValue={vehicle?.transmission}
        />
        <Field
          label="Engine"
          name="engine"
          defaultValue={vehicle?.engine ?? ""}
        />
        <Field
          label="Body type"
          name="bodyType"
          required
          defaultValue={vehicle?.bodyType}
        />
        <Field
          label="Exterior color"
          name="exteriorColor"
          defaultValue={vehicle?.exteriorColor ?? ""}
        />
        <Field
          label="Interior color"
          name="interiorColor"
          defaultValue={vehicle?.interiorColor ?? ""}
        />
        <Field
          label="Condition"
          name="condition"
          defaultValue={vehicle?.condition ?? "Excellent"}
        />
        <Field
          label="Location"
          name="location"
          defaultValue={vehicle?.location ?? ""}
        />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Availability
          </label>
          <select
            name="availability"
            defaultValue={vehicle?.availability ?? "available"}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
          >
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={vehicle?.featured ?? false}
              className="h-4 w-4 rounded border-border accent-[var(--gold,#c9a227)]"
            />
            Featured on homepage
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Description
        </label>
        <textarea
          name="description"
          rows={4}
          defaultValue={vehicle?.description ?? ""}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Features (one per line)
        </label>
        <textarea
          name="features"
          rows={4}
          defaultValue={featuresValue}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-gold"
          placeholder="Panoramic Roof&#10;Leather seats"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Image paths / URLs (one per line, first = primary)
        </label>
        <textarea
          name="images"
          rows={5}
          defaultValue={imagesValue}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-gold"
          placeholder="/vehicles/1/front.jpg"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Use local public paths (e.g. /vehicles/…) or absolute https image URLs.
          Files are not uploaded to the server filesystem.
        </p>
        {vehicle?.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehicle.images[0]}
            alt="Primary preview"
            className="mt-3 h-32 w-auto rounded-lg border border-border object-cover"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-gold-light disabled:opacity-60"
        >
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create vehicle"
              : "Save changes"}
        </button>
        <a
          href="/admin/inventory"
          className="rounded-full border border-border px-6 py-2.5 text-sm font-medium transition hover:border-gold hover:text-gold"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
      />
    </div>
  );
}
