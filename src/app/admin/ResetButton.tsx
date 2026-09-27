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
        className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-50 disabled:opacity-50"
      >
        {pending ? "Resetting…" : "Reset demo data"}
      </button>
      {message && <span className="text-sm text-slate-600">{message}</span>}
    </div>
  );
}
