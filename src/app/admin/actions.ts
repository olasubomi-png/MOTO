"use server";

import { redirect } from "next/navigation";
import {
  verifyAdminCredentials,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  requireAdminSession,
  getAdminSession,
} from "@/lib/admin-auth";
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleById,
  InventoryConflictError,
} from "@/lib/vehicle-repository";
import type { Vehicle, VehicleAvailability } from "@/lib/vehicle-types";
import { validateVehicle } from "@/lib/vehicle-validation";

export type ActionResult = {
  ok: boolean;
  error?: string;
  conflict?: boolean;
  id?: string;
};

function formString(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function formNumber(formData: FormData, key: string): number {
  const raw = formString(formData, key);
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

function formBool(formData: FormData, key: string): boolean {
  const v = formData.get(key);
  return v === "on" || v === "true" || v === "1";
}

function parseFeatures(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseImages(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const AVAILABILITIES: VehicleAvailability[] = [
  "available",
  "reserved",
  "sold",
  "unpublished",
];

function parseAvailability(raw: string): VehicleAvailability {
  if (AVAILABILITIES.includes(raw as VehicleAvailability)) {
    return raw as VehicleAvailability;
  }
  return "available";
}

/* -------------------- Auth -------------------- */

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const username = formString(formData, "username");
  const password = formString(formData, "password");

  if (!username || !password) {
    return { ok: false, error: "Username and password are required." };
  }

  try {
    if (!verifyAdminCredentials(username, password)) {
      return { ok: false, error: "Invalid credentials." };
    }
    await setAdminSessionCookie(username);
  } catch {
    return {
      ok: false,
      error: "Admin authentication is not configured on this server.",
    };
  }

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}

/* -------------------- Inventory mutations -------------------- */

async function assertAdmin(): Promise<ActionResult | null> {
  const session = await getAdminSession();
  if (!session) {
    return { ok: false, error: "Unauthorized." };
  }
  return null;
}

export async function createVehicleAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const payload = {
    make: formString(formData, "make"),
    model: formString(formData, "model"),
    year: formNumber(formData, "year"),
    price: formNumber(formData, "price"),
    currency: formString(formData, "currency") || "USD",
    mileage: formNumber(formData, "mileage"),
    fuel: formString(formData, "fuel"),
    transmission: formString(formData, "transmission"),
    engine: formString(formData, "engine"),
    bodyType: formString(formData, "bodyType"),
    exteriorColor: formString(formData, "exteriorColor"),
    interiorColor: formString(formData, "interiorColor"),
    condition: formString(formData, "condition") || "Excellent",
    description: formString(formData, "description"),
    features: parseFeatures(formString(formData, "features")),
    location: formString(formData, "location"),
    availability: parseAvailability(formString(formData, "availability")),
    featured: formBool(formData, "featured"),
    images: parseImages(formString(formData, "images")),
  };

  const draft = {
    ...payload,
    id: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const issues = validateVehicle(draft).filter((i) => i.field !== "id");
  if (issues.length > 0) {
    return { ok: false, error: issues.map((i) => i.message).join("; ") };
  }

  try {
    await requireAdminSession();
    const created = await createVehicle(payload);
    return { ok: true, id: created.id };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create vehicle.";
    return { ok: false, error: message };
  }
}

export async function updateVehicleAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const id = formString(formData, "id");
  if (!id) return { ok: false, error: "Missing vehicle id." };

  const expectedUpdatedAt = formString(formData, "expectedUpdatedAt");

  const data: Partial<Vehicle> = {
    make: formString(formData, "make"),
    model: formString(formData, "model"),
    year: formNumber(formData, "year"),
    price: formNumber(formData, "price"),
    currency: formString(formData, "currency") || "USD",
    mileage: formNumber(formData, "mileage"),
    fuel: formString(formData, "fuel"),
    transmission: formString(formData, "transmission"),
    engine: formString(formData, "engine"),
    bodyType: formString(formData, "bodyType"),
    exteriorColor: formString(formData, "exteriorColor"),
    interiorColor: formString(formData, "interiorColor"),
    condition: formString(formData, "condition"),
    description: formString(formData, "description"),
    features: parseFeatures(formString(formData, "features")),
    location: formString(formData, "location"),
    availability: parseAvailability(formString(formData, "availability")),
    featured: formBool(formData, "featured"),
    images: parseImages(formString(formData, "images")),
  };

  try {
    await requireAdminSession();
    const updated = await updateVehicle(id, data, {
      expectedUpdatedAt: expectedUpdatedAt || undefined,
    });
    if (!updated) return { ok: false, error: "Vehicle not found." };
    return { ok: true, id: updated.id };
  } catch (err) {
    if (err instanceof InventoryConflictError) {
      return {
        ok: false,
        conflict: true,
        error:
          "This vehicle was modified by another session. Reload and try again.",
      };
    }
    const message =
      err instanceof Error ? err.message : "Failed to update vehicle.";
    return { ok: false, error: message };
  }
}

export async function setAvailabilityAction(
  id: string,
  availability: VehicleAvailability
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!AVAILABILITIES.includes(availability)) {
    return { ok: false, error: "Invalid availability." };
  }
  try {
    await requireAdminSession();
    const existing = await getVehicleById(id);
    if (!existing) return { ok: false, error: "Vehicle not found." };
    const updated = await updateVehicle(
      id,
      { availability },
      { expectedUpdatedAt: existing.updatedAt }
    );
    if (!updated) return { ok: false, error: "Vehicle not found." };
    return { ok: true, id };
  } catch (err) {
    if (err instanceof InventoryConflictError) {
      return {
        ok: false,
        conflict: true,
        error: "Conflict — reload and try again.",
      };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed.",
    };
  }
}

export async function toggleFeaturedAction(id: string): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  try {
    await requireAdminSession();
    const existing = await getVehicleById(id);
    if (!existing) return { ok: false, error: "Vehicle not found." };
    const updated = await updateVehicle(
      id,
      { featured: !existing.featured },
      { expectedUpdatedAt: existing.updatedAt }
    );
    if (!updated) return { ok: false, error: "Vehicle not found." };
    return { ok: true, id };
  } catch (err) {
    if (err instanceof InventoryConflictError) {
      return {
        ok: false,
        conflict: true,
        error: "Conflict — reload and try again.",
      };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed.",
    };
  }
}

export async function unpublishVehicleAction(id: string): Promise<ActionResult> {
  return setAvailabilityAction(id, "unpublished");
}

export async function deleteVehicleAction(id: string): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!id) return { ok: false, error: "Missing id." };
  try {
    await requireAdminSession();
    const ok = await deleteVehicle(id);
    if (!ok) return { ok: false, error: "Vehicle not found." };
    return { ok: true, id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed.",
    };
  }
}
