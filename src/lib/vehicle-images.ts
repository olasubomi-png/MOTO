import { isSafePublicImagePath } from "./vehicle-validation";

export const PLACEHOLDER_IMAGE = "/vehicles/placeholder.svg";

/**
 * Client-safe image resolver — no filesystem access.
 * Unsafe/empty paths → branded placeholder.
 * Existence of files is handled by next/image onError at the component layer.
 */
export function getVehicleImage(src?: string | null): string {
  if (!src || typeof src !== "string" || !src.trim()) {
    return PLACEHOLDER_IMAGE;
  }
  const trimmed = src.trim();
  if (!isSafePublicImagePath(trimmed)) {
    return PLACEHOLDER_IMAGE;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
