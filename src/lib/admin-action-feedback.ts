/**
 * Pure helpers for admin inventory action UI feedback.
 * Safe to import from client components and unit tests.
 */

export type AdminActionKind =
  | "feature"
  | "availability"
  | "unpublish"
  | "delete";

export type ActionResultLike = {
  ok: boolean;
  error?: string;
  conflict?: boolean;
  id?: string;
};

/** Human-readable pending labels for inventory row actions. */
export function pendingLabel(
  kind: AdminActionKind,
  opts?: { featured?: boolean }
): string {
  switch (kind) {
    case "feature":
      return opts?.featured ? "Unfeaturing…" : "Featuring…";
    case "availability":
      return "Saving…";
    case "unpublish":
      return "Unpublishing…";
    case "delete":
      return "Deleting…";
    default:
      return "Working…";
  }
}

/** Idle labels for feature toggle. */
export function featureButtonLabel(featured: boolean): string {
  return featured ? "Unfeature" : "Feature";
}

/**
 * Map a server ActionResult to a safe user-facing message.
 * Never returns secrets or raw stack traces.
 */
export function messageFromActionResult(
  result: ActionResultLike,
  successFallback: string
): { type: "ok" | "err"; message: string } {
  if (result.ok) {
    return { type: "ok", message: successFallback };
  }
  const raw = (result.error || "").trim();
  if (!raw) {
    return { type: "err", message: "Action failed. Please try again." };
  }
  // Block accidental leakage of connection strings / secrets
  const lower = raw.toLowerCase();
  if (
    lower.includes("password") ||
    lower.includes("secret") ||
    lower.includes("database_url") ||
    lower.includes("connection string") ||
    lower.includes("postgres://") ||
    lower.includes("postgresql://")
  ) {
    return {
      type: "err",
      message: "Something went wrong. Please try again.",
    };
  }
  // Cap length for UI
  const message = raw.length > 200 ? `${raw.slice(0, 197)}…` : raw;
  return { type: "err", message };
}

/** Safe client-side catch fallback (never expose Error.message from unknown throws). */
export function unexpectedActionErrorMessage(): string {
  return "Something went wrong. Please try again.";
}

export const DELETE_CONFIRM_COPY =
  "This permanently deletes the vehicle. Prefer Unpublish when possible.";
