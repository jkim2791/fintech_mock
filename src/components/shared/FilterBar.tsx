"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { humanize } from "@/lib/format";

export interface FilterDef {
  name: string;
  label: string;
  options: readonly string[];
}

/** URL-backed select filters; the page reads `searchParams` server-side. */
export function FilterBar({ filters }: { filters: FilterDef[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    router.replace(`${pathname}?${next.toString()}`);
  }

  const hasAny = filters.some((f) => params.get(f.name));

  return (
    <div className="flex flex-wrap items-end gap-3">
      {filters.map((f) => (
        <label key={f.name} className="flex flex-col gap-1 text-xs text-slate-500">
          {f.label}
          <select
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
            value={params.get(f.name) ?? ""}
            onChange={(e) => update(f.name, e.target.value)}
          >
            <option value="">All</option>
            {f.options.map((o) => (
              <option key={o} value={o}>
                {humanize(o)}
              </option>
            ))}
          </select>
        </label>
      ))}
      {hasAny && (
        <button type="button" onClick={() => router.replace(pathname)} className="pb-1.5 text-xs text-slate-500 underline">
          Clear
        </button>
      )}
    </div>
  );
}
