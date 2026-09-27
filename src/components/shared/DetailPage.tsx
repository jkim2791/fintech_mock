import Link from "next/link";
import type { ReactNode } from "react";
import { StatusBadge } from "./StatusBadge";
import { ArrowLeftIcon } from "./Icons";

export interface Field {
  label: string;
  value: ReactNode;
  mono?: boolean;
}

/**
 * Standard detail layout: header with status, field list on the left,
 * sticky action panel + activity on the right.
 */
export function DetailPage({
  backHref,
  backLabel,
  title,
  subtitle,
  status,
  badges,
  fields,
  side,
  children,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  status: string;
  badges?: ReactNode;
  fields: Field[];
  side: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div>
      <Link href={backHref} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900">
        <ArrowLeftIcon size={12} />
        {backLabel}
      </Link>
      <header className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 pb-5">
        <h1 className="font-mono text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <span className="h-4 w-px bg-slate-200" />
        <StatusBadge status={status} />
        {badges}
        {subtitle && <span className="text-sm text-slate-500">{subtitle}</span>}
      </header>
      <div className="mt-6 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="mb-1 text-sm font-semibold text-slate-900">Details</h2>
            <dl className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.label} className="border-b border-slate-200/80 py-3">
                  <dt className="text-xs text-slate-500">{f.label}</dt>
                  <dd className={`mt-0.5 text-sm text-slate-900 ${f.mono ? "font-mono text-[13px]" : ""}`}>{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          {children}
        </div>
        <div className="space-y-4 self-start xl:sticky xl:top-20">{side}</div>
      </div>
    </div>
  );
}
