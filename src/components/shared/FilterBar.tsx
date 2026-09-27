"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { humanize } from "@/lib/format";
import { useT } from "@/lib/i18n/client";
import { ChevronDownIcon, CloseIcon } from "./Icons";

export interface FilterDef {
  name: string;
  label: string;
  options: readonly string[];
  /** Optional display labels; falls back to humanize(option). */
  labels?: Record<string, string>;
}

/** URL-backed select filters; the page reads `searchParams` server-side. */
export function FilterBar({ filters, summary }: { filters: FilterDef[]; summary?: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useT();

  function update(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    router.replace(`${pathname}?${next.toString()}`);
  }

  const hasAny = filters.some((f) => params.get(f.name));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((f) => {
        const value = params.get(f.name) ?? "";
        return (
          <label
            key={f.name}
            className={`relative inline-flex h-8 items-center rounded-md border bg-white pl-2.5 text-xs transition-colors hover:border-slate-400 ${
              value ? "border-slate-900" : "border-slate-200"
            }`}
          >
            <span className="text-slate-500">{f.label}</span>
            <select
              className="h-full cursor-pointer appearance-none bg-transparent pl-1.5 pr-7 text-xs font-medium text-slate-900 focus:outline-none"
              value={value}
              onChange={(e) => update(f.name, e.target.value)}
            >
              <option value="">{t("common.all")}</option>
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {f.labels?.[o] ?? humanize(o)}
                </option>
              ))}
            </select>
            <ChevronDownIcon size={12} className="pointer-events-none absolute right-2 text-slate-400" />
          </label>
        );
      })}
      {hasAny && (
        <button
          type="button"
          onClick={() => router.replace(pathname)}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <CloseIcon size={12} />
          {t("common.clear")}
        </button>
      )}
      {summary && <div className="ml-auto text-xs tabular-nums text-slate-500">{summary}</div>}
    </div>
  );
}
