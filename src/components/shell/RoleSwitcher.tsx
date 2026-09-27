"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/lib/auth/types";
import { switchDemoUser } from "@/lib/auth/actions";

export function RoleSwitcher({ users, currentUserId }: { users: AuthUser[]; currentUserId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-xs text-slate-500">
      <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800">DEMO_MODE</span>
      <span>Act as</span>
      <select
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 disabled:opacity-50"
        value={currentUserId}
        disabled={pending}
        onChange={(e) => {
          const id = e.target.value;
          start(async () => {
            await switchDemoUser(id);
            router.refresh();
          });
        }}
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} — {u.role}
          </option>
        ))}
      </select>
    </label>
  );
}
