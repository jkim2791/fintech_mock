"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetDemoData } from "./actions";

export function ResetButton() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="flex items-center gap-3">
      {message && <span className="text-xs text-slate-500">{message}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await resetDemoData();
            setMessage(r.message);
            router.refresh();
          })
        }
        className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-rose-700 hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50"
      >
        {pending ? "Resetting…" : "Reset demo data"}
      </button>
    </div>
  );
}
