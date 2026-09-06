"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  toggleFeaturedAction,
  unpublishVehicleAction,
  deleteVehicleAction,
  setAvailabilityAction,
  type ActionResult,
} from "@/app/admin/actions";
import type { VehicleAvailability } from "@/lib/vehicle-types";
import {
  type AdminActionKind,
  pendingLabel,
  featureButtonLabel,
  messageFromActionResult,
  unexpectedActionErrorMessage,
  DELETE_CONFIRM_COPY,
} from "@/lib/admin-action-feedback";

const btnClass =
  "rounded-full border border-border px-2.5 py-1.5 text-xs font-medium min-h-[36px] transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

export function InventoryRowActions({
  id,
  featured,
  availability,
}: {
  id: string;
  featured: boolean;
  availability: VehicleAvailability;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<AdminActionKind | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    message: string;
  } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const dialogTitleId = useId();
  const dialogDescId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const selectId = useId();

  const anyBusy = busy !== null;

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(t);
  }, [feedback]);

  useEffect(() => {
    if (!deleteOpen) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && busy !== "delete") {
        setDeleteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteOpen, busy]);

  const run = useCallback(
    async (
      kind: AdminActionKind,
      action: () => Promise<ActionResult>,
      successMessage: string
    ) => {
      if (busy) return;
      setBusy(kind);
      setFeedback(null);
      try {
        const result = await action();
        const mapped = messageFromActionResult(result, successMessage);
        setFeedback(mapped);
        if (result.ok) {
          router.refresh();
        }
      } catch {
        setFeedback({
          type: "err",
          message: unexpectedActionErrorMessage(),
        });
      } finally {
        setBusy(null);
      }
    },
    [busy, router]
  );

  return (
    <div className="space-y-2">
      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-lg border px-2.5 py-1.5 text-xs ${
            feedback.type === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {feedback.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`/admin/inventory/${id}/edit`}
          className={btnClass}
          aria-label={`Edit vehicle ${id}`}
        >
          Edit
        </a>
        <a
          href={`/inventory/${id}`}
          target="_blank"
          rel="noreferrer"
          className={btnClass}
          aria-label={`Preview vehicle ${id} on public site`}
        >
          Preview
        </a>

        <button
          type="button"
          disabled={anyBusy}
          aria-busy={busy === "feature"}
          aria-label={
            featured ? `Unfeature vehicle ${id}` : `Feature vehicle ${id}`
          }
          onClick={() =>
            run(
              "feature",
              () => toggleFeaturedAction(id),
              featured ? "Removed from featured." : "Marked as featured."
            )
          }
          className={btnClass}
        >
          {busy === "feature"
            ? pendingLabel("feature", { featured })
            : featureButtonLabel(featured)}
        </button>

        <div className="inline-flex items-center gap-1.5">
          <label htmlFor={selectId} className="sr-only">
            Availability for vehicle {id}
          </label>
          <select
            id={selectId}
            disabled={anyBusy}
            aria-busy={busy === "availability"}
            value={availability}
            onChange={(e) => {
              const value = e.target.value as VehicleAvailability;
              void run(
                "availability",
                () => setAvailabilityAction(id, value),
                `Status set to ${value}.`
              );
            }}
            className="min-h-[36px] rounded-full border border-border bg-background px-2 py-1 text-xs outline-none focus:border-gold focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
            <option value="unpublished">Unpublished</option>
          </select>
          {busy === "availability" && (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {pendingLabel("availability")}
            </span>
          )}
        </div>

        {availability !== "unpublished" && (
          <button
            type="button"
            disabled={anyBusy}
            aria-busy={busy === "unpublish"}
            aria-label={`Unpublish vehicle ${id}`}
            onClick={() =>
              run(
                "unpublish",
                () => unpublishVehicleAction(id),
                "Vehicle unpublished."
              )
            }
            className={btnClass}
          >
            {busy === "unpublish"
              ? pendingLabel("unpublish")
              : "Unpublish"}
          </button>
        )}

        <button
          type="button"
          disabled={anyBusy}
          aria-label={`Delete vehicle ${id}`}
          onClick={() => setDeleteOpen(true)}
          className="min-h-[36px] rounded-full border border-red-500/40 px-2.5 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          Delete
        </button>
      </div>

      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && busy !== "delete") {
              setDeleteOpen(false);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescId}
            className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl"
          >
            <h3
              id={dialogTitleId}
              className="text-base font-semibold text-foreground"
            >
              Delete vehicle?
            </h3>
            <p
              id={dialogDescId}
              className="mt-2 text-sm text-muted-foreground"
            >
              {DELETE_CONFIRM_COPY}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                disabled={busy === "delete"}
                onClick={() => setDeleteOpen(false)}
                className="min-h-[44px] rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:border-gold hover:text-gold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy === "delete"}
                aria-busy={busy === "delete"}
                onClick={async () => {
                  await run(
                    "delete",
                    () => deleteVehicleAction(id),
                    "Vehicle deleted."
                  );
                  setDeleteOpen(false);
                }}
                className="min-h-[44px] rounded-full border border-red-500/50 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
              >
                {busy === "delete"
                  ? pendingLabel("delete")
                  : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
