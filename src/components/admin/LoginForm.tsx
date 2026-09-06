"use client";

import { useActionState } from "react";
import { loginAction, type ActionResult } from "@/app/admin/actions";

const initial: ActionResult | null = null;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="username"
          className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>

      {state && !state.ok && state.error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gold px-4 py-3 text-sm font-semibold text-black transition hover:bg-gold-light disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
