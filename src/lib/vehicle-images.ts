import { isSafePublicImagePath } from "./vehicle-validation";

export const PLACEHOLDER_IMAGE = "/vehicles/placeholder.svg";

/**
 * Client-safe image resolver — no filesystem access.
 * Unsafe/empty paths → branded placeholder.
 * Local public paths and https URLs are returned as-is (after safety check).
 */
export function getVehicleImage(src?: string | null): string {
  if (!src || typeof src !== "string" || !src.trim()) {
    return PLACEHOLDER_IMAGE;
  }
  const trimmed = src.trim();
  if (!isSafePublicImagePath(trimmed)) {
    return PLACEHOLDER_IMAGE;
  }
  if (trimmed.startsWith("https://")) {
    return trimmed;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
