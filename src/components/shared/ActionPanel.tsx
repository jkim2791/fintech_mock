"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult, CaseAction } from "@/lib/workflow/types";

export interface ActionAvailability {
  action: CaseAction;
  permitted: boolean;
  transitionOk: boolean;
  requiredRoles: string[];
  policyNote: string | null;
}

const LABELS: Record<CaseAction, { label: string; style: string; prompt: string }> = {
  NOTE: { label: "Add note", style: "border-slate-300 text-slate-800 hover:bg-slate-50", prompt: "Note" },
  ESCALATE: { label: "Escalate", style: "border-amber-300 text-amber-900 hover:bg-amber-50", prompt: "Reason for escalation" },
  APPROVE: { label: "Approve", style: "border-emerald-300 text-emerald-800 hover:bg-emerald-50", prompt: "Approval rationale" },
  REJECT: { label: "Reject", style: "border-rose-300 text-rose-800 hover:bg-rose-50", prompt: "Reason for rejection" },
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

  const current = active ? availability.find((a) => a.action === active) : undefined;

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-medium">Actions</h2>
      <div className="space-y-3 px-5 py-4">
        <div className="grid grid-cols-2 gap-2">
          {availability.map((a) => {
            const meta = LABELS[a.action];
            const disabled = !a.transitionOk;
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
                className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                  active === a.action ? "ring-2 ring-slate-900 ring-offset-1" : ""
                } ${a.permitted ? meta.style : "border-dashed border-slate-300 text-slate-400 hover:bg-slate-50"}`}
              >
                {!a.permitted && <span aria-hidden>🔒</span>}
                {meta.label}
              </button>
            );
          })}
        </div>

        {current && (
          <form action={formAction} className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
            <input type="hidden" name="entityId" value={entityId} />
            <input type="hidden" name="action" value={current.action} />
            <div className="text-sm font-medium">{LABELS[current.action].label}</div>
            {current.policyNote && <p className="text-xs text-slate-600">{current.policyNote}</p>}
            {!current.permitted && (
              <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                Your role is not expected to hold this permission (requires {current.requiredRoles.join(" or ")}). Submitting will be
                rejected by the server.
              </p>
            )}
            <textarea
              name="reason"
              required
              minLength={current.action === "NOTE" ? 1 : 3}
              rows={3}
              placeholder={LABELS[current.action].prompt}
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {pending ? "Submitting…" : `Confirm ${LABELS[current.action].label.toLowerCase()}`}
              </button>
              <button type="button" onClick={() => setActive(null)} className="rounded-md px-3 py-1.5 text-sm text-slate-600">
                Cancel
              </button>
            </div>
          </form>
        )}

        {result && (
          <p
            role="status"
            className={`rounded-md px-3 py-2 text-sm ${
              result.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
            }`}
          >
            {result.ok ? result.message : result.error}
          </p>
        )}
      </div>
    </section>
  );
}
