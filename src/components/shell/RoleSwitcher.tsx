"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth/types";
import { switchDemoUser } from "@/lib/auth/actions";

const SHORT_ROLE: Record<string, string> = {
  OPS_ANALYST: "Analyst",
  COMPLIANCE_APPROVER: "Approver",
  ADMIN: "Admin",
};

/** Segmented control: one click switches the demo identity (cookie + refresh). */
export function RoleSwitcher({ users, currentUserId }: { users: AuthUser[]; currentUserId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function select(id: string) {
    if (id === currentUserId) return;
    start(async () => {
      await switchDemoUser(id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Demo · act as
      </span>
      <div
        role="radiogroup"
        aria-label="Switch demo user"
        className={`inline-flex h-8 items-center rounded-md border border-slate-200 bg-white p-0.5 ${pending ? "opacity-60" : ""}`}
      >
        {users.map((u) => {
          const active = u.id === currentUserId;
          return (
            <button
              key={u.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={pending}
              title={`${u.name} · ${u.role}`}
              onClick={() => select(u.id)}
              className={`h-full rounded-[5px] px-2.5 text-xs transition-colors ${
                active ? "bg-slate-900 font-medium text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {SHORT_ROLE[u.role] ?? u.role}
            </button>
          );
        })}
      </div>
    </div>
  );
}
