"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  verifyAdminCredentials,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  requireAdminSession,
  AdminAuthConfigError,
  getAdminAuthEnvStatus,
} from "@/lib/admin-auth";
import {
  checkLoginRateLimit,
  recordLoginFailure,
  clearLoginFailures,
} from "@/lib/admin-rate-limit";
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleById,
  InventoryConflictError,
} from "@/lib/vehicle-repository";
import type { Vehicle, VehicleAvailability } from "@/lib/vehicle-types";
import {
  validateVehicle,
  isSafePublicImagePath,
} from "@/lib/vehicle-validation";

export type ActionResult = {
  ok: boolean;
  error?: string;
  conflict?: boolean;
  id?: string;
};

/** Never leak connection strings / secrets into the browser. */
function publicActionError(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;
  const msg = "message" in err && typeof (err as Error).message === "string"
    ? (err as Error).message
    : "";
  const lower = msg.toLowerCase();
  if (
    !msg ||
    lower.includes("password") ||
    lower.includes("secret") ||
    lower.includes("database") ||
    lower.includes("postgres") ||
    lower.includes("econn") ||
    lower.includes("neon")
  ) {
    return fallback;
  }
  // Known safe business messages (validation, not found, conflict handled separately)
  if (
    lower.includes("not found") ||
    lower.includes("invalid") ||
    lower.includes("required") ||
    lower.includes("must be") ||
    lower.includes("unsafe") ||
    lower.includes("conflict") ||
    lower.includes("modified by another")
  ) {
    return msg.length > 200 ? msg.slice(0, 197) + "…" : msg;
  }
  return fallback;
}


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

function assertSafeImages(images: string[]): string | null {
  for (const img of images) {
    if (!isSafePublicImagePath(img)) {
      return `Unsafe or invalid image path: ${img.slice(0, 80)}`;
    }
  }
  return null;
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

async function clientKey(username?: string): Promise<string> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    const real = h.get("x-real-ip")?.trim();
    const ip = fwd || real || "unknown";
    return username ? `${ip}:${username.toLowerCase()}` : ip;
  } catch {
    return username ? `unknown:${username.toLowerCase()}` : "unknown";
  }
}

function vehicleFieldsFromForm(formData: FormData) {
  return {
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
}

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const username = formString(formData, "username");
  const password = formString(formData, "password");

  if (!username || !password) {
    return { ok: false, error: "Username and password are required." };
  }

  const key = await clientKey(username);
  const limit = checkLoginRateLimit(key);
  if (!limit.allowed) {
    return {
      ok: false,
      error: `Too many failed sign-in attempts. Try again in ${limit.retryAfterSec} seconds.`,
    };
  }

  // 1) Credential verification (config vs invalid password are distinct)
  let credentialsOk = false;
  try {
    credentialsOk = verifyAdminCredentials(username, password);
  } catch (err) {
    if (err instanceof AdminAuthConfigError) {
      const status = getAdminAuthEnvStatus();
      // Safe operator hint — never includes secret values
      const missing: string[] = [];
      if (!status.hasUsername) missing.push("ADMIN_USERNAME");
      if (!status.hasPassword) missing.push("ADMIN_PASSWORD");
      return {
        ok: false,
        error: `Admin credentials are not configured on this server (missing ${missing.join(", ") || "credentials"}).`,
      };
    }
    return { ok: false, error: "Unable to verify credentials right now." };
  }

  if (!credentialsOk) {
    recordLoginFailure(key);
    return { ok: false, error: "Invalid credentials." };
  }

  // 2) Session token + HTTP-only cookie
  try {
    clearLoginFailures(key);
    await setAdminSessionCookie(username);
  } catch (err) {
    if (err instanceof AdminAuthConfigError) {
      const status = getAdminAuthEnvStatus();
      if (!status.hasSessionSecret) {
        return {
          ok: false,
          error:
            "Admin session secret is not configured on this server (ADMIN_SESSION_SECRET).",
        };
      }
      if (status.sessionSecretLength < 16) {
        return {
          ok: false,
          error:
            "Admin session secret is too short (ADMIN_SESSION_SECRET must be at least 16 characters).",
        };
      }
      return {
        ok: false,
        error: "Admin session configuration is invalid on this server.",
      };
    }
    return {
      ok: false,
      error: "Could not create the admin session cookie. Try again.",
    };
  }

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}

export async function createVehicleAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized." };
  }

  const payload = vehicleFieldsFromForm(formData);
  const imgErr = assertSafeImages(payload.images);
  if (imgErr) return { ok: false, error: imgErr };

  const draft: Vehicle = {
    ...payload,
    id: "pending-create",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const issues = validateVehicle(draft).filter((i) => i.field !== "id");
  if (issues.length > 0) {
    return { ok: false, error: issues.map((i) => i.message).join("; ") };
  }

  try {
    const created = await createVehicle(payload);
    return { ok: true, id: created.id };
  } catch (err) {
    return {
      ok: false,
      error: publicActionError(err, "Failed to create vehicle."),
    };
  }
}

export async function updateVehicleAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized." };
  }

  const id = formString(formData, "id");
  if (!id) return { ok: false, error: "Missing vehicle id." };

  const expectedUpdatedAt = formString(formData, "expectedUpdatedAt");
  const fields = vehicleFieldsFromForm(formData);
  const imgErr = assertSafeImages(fields.images);
  if (imgErr) return { ok: false, error: imgErr };

  const existing = await getVehicleById(id);
  if (!existing) return { ok: false, error: "Vehicle not found." };

  const candidate: Vehicle = {
    ...existing,
    ...fields,
    id,
    updatedAt: existing.updatedAt,
  };
  const issues = validateVehicle(candidate);
  if (issues.length > 0) {
    return { ok: false, error: issues.map((i) => i.message).join("; ") };
  }

  try {
    const updated = await updateVehicle(id, fields, {
      expectedUpdatedAt: expectedUpdatedAt || existing.updatedAt,
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
    return {
      ok: false,
      error: publicActionError(err, "Failed to update vehicle."),
    };
  }
}

export async function setAvailabilityAction(
  id: string,
  availability: VehicleAvailability
): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized." };
  }
  if (!id) return { ok: false, error: "Missing id." };
  if (!AVAILABILITIES.includes(availability)) {
    return { ok: false, error: "Invalid availability." };
  }

  try {
    const existing = await getVehicleById(id);
    if (!existing) return { ok: false, error: "Vehicle not found." };
    const candidate: Vehicle = { ...existing, availability };
    const issues = validateVehicle(candidate);
    if (issues.length > 0) {
      return { ok: false, error: issues.map((i) => i.message).join("; ") };
    }
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
      error: publicActionError(err, "Update failed."),
    };
  }
}

export async function toggleFeaturedAction(id: string): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized." };
  }
  if (!id) return { ok: false, error: "Missing id." };

  try {
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
      error: publicActionError(err, "Update failed."),
    };
  }
}

export async function unpublishVehicleAction(
  id: string
): Promise<ActionResult> {
  return setAvailabilityAction(id, "unpublished");
}

export async function deleteVehicleAction(id: string): Promise<ActionResult> {
  try {
    await requireAdminSession();
  } catch {
    return { ok: false, error: "Unauthorized." };
  }
  if (!id) return { ok: false, error: "Missing id." };

  try {
    const ok = await deleteVehicle(id);
    if (!ok) return { ok: false, error: "Vehicle not found." };
    return { ok: true, id };
  } catch (err) {
    return {
      ok: false,
      error: publicActionError(err, "Delete failed."),
    };
  }
}
