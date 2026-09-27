"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult, CaseAction } from "@/lib/workflow/types";
import { LockIcon } from "./Icons";

export interface ActionAvailability {
  action: CaseAction;
  permitted: boolean;
  transitionOk: boolean;
  requiredRoles: string[];
  policyNote: string | null;
}

type Variant = "primary" | "secondary" | "danger" | "ghost";

const META: Record<CaseAction, { label: string; prompt: string; variant: Variant; order: number }> = {
  APPROVE: { label: "Approve", prompt: "Approval rationale", variant: "primary", order: 0 },
  REJECT: { label: "Reject", prompt: "Reason for rejection", variant: "danger", order: 1 },
  ESCALATE: { label: "Escalate", prompt: "Reason for escalation", variant: "secondary", order: 2 },
  NOTE: { label: "Add note", prompt: "Note for the case file", variant: "secondary", order: 3 },
};

const VARIANT_STYLES: Record<Variant, string> = {
  primary: "border-slate-900 bg-slate-900 text-white hover:bg-slate-800",
  danger: "border-slate-300 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50",
  secondary: "border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
  ghost: "border-transparent text-slate-600 hover:bg-slate-100",
};

/**
 * Shared confirm-with-reason workflow. Actions the current role is not
 * permitted to perform are still rendered (locked) so the server-side
 * rejection can be demonstrated; the server is the source of truth.
 */
export function ActionPanel({
  entityId,
  availability,
  serverAction,
}: {
  entityId: string;
  availability: ActionAvailability[];
  serverAction: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
}) {
  const [active, setActive] = useState<CaseAction | null>(null);
  const [result, formAction, pending] = useActionState(serverAction, null);
  const router = useRouter();

  useEffect(() => {
    if (result?.ok) {
      setActive(null);
      router.refresh();
    }
  }, [result, router]);

  const ordered = [...availability].sort((a, b) => META[a.action].order - META[b.action].order);
  const current = active ? availability.find((a) => a.action === active) : undefined;
  const anyOpen = ordered.some((a) => a.transitionOk);

  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-slate-900">Actions</h2>
        <span className="text-[11px] text-slate-500">{anyOpen ? "Reason is recorded in the audit log" : "Case is closed"}</span>
      </header>
      <div className="space-y-3 px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          {ordered.map((a) => {
            const meta = META[a.action];
            const disabled = !a.transitionOk;
            const selected = active === a.action;
            const style = a.permitted ? VARIANT_STYLES[meta.variant] : "border-dashed border-slate-300 bg-white text-slate-400 hover:bg-slate-50";
            return (
              <button
                key={a.action}
                type="button"
                disabled={disabled || pending}
                onClick={() => setActive(a.action)}
                title={
                  !a.transitionOk
                    ? "Not available in the current status"
                    : !a.permitted
                      ? `Requires ${a.requiredRoles.join(" or ")}`
                      : undefined
                }
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${style} ${
                  selected ? "ring-2 ring-slate-900/15 ring-offset-1" : ""
                }`}
              >
                {!a.permitted && <LockIcon size={13} />}
                {meta.label}
              </button>
            );
          })}
        </div>

        {current && (
          <form action={formAction} className="space-y-2.5 border-t border-slate-200 pt-3">
            <input type="hidden" name="entityId" value={entityId} />
            <input type="hidden" name="action" value={current.action} />
            <div className="flex items-baseline justify-between">
              <label htmlFor="action-reason" className="text-xs font-medium text-slate-900">
                {META[current.action].prompt}
              </label>
              <span className="text-[11px] text-slate-400">Required</span>
            </div>
            {current.policyNote && <p className="text-xs leading-relaxed text-slate-500">{current.policyNote}</p>}
            {!current.permitted && (
              <p className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-amber-900">
                <LockIcon size={13} className="mt-0.5" />
                <span>
                  Requires {current.requiredRoles.join(" or ")}. Your role does not hold this permission, so the server will reject the request.
                </span>
              </p>
            )}
            <textarea
              id="action-reason"
              name="reason"
              required
              autoFocus
              minLength={current.action === "NOTE" ? 1 : 3}
              rows={3}
              placeholder={current.action === "NOTE" ? "What should the next reviewer know?" : "Why is this the right decision?"}
              className="w-full resize-y rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-8 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {pending ? "Submitting…" : `Confirm ${META[current.action].label.toLowerCase()}`}
              </button>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="inline-flex h-8 items-center rounded-md px-3 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {result && (
          <p
            role="status"
            className={`rounded-md border px-3 py-2 text-sm leading-relaxed ${
              result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {result.ok ? result.message : result.error}
          </p>
        )}
      </div>
    </section>
  );
}
