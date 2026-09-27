import Link from "next/link";
import type { ReactNode } from "react";
import { StatusBadge } from "./StatusBadge";

export interface Field {
  label: string;
  value: ReactNode;
  mono?: boolean;
}

/**
 * Standard two-column detail layout: header with status, field grid on the
 * left, action panel + activity on the right.
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
      <Link href={backHref} className="text-xs text-slate-500 hover:text-slate-900">
        ← {backLabel}
      </Link>
      <div className="mt-2 mb-6 flex items-center gap-3">
        <h1 className="font-mono text-xl font-semibold tracking-tight">{title}</h1>
        <StatusBadge status={status} />
        {badges}
        {subtitle && <span className="text-sm text-slate-500">{subtitle}</span>}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white px-5 py-4">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.label}>
                  <dt className="text-xs text-slate-500">{f.label}</dt>
                  <dd className={`mt-0.5 text-sm ${f.mono ? "font-mono" : ""}`}>{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          {children}
        </div>
        <div className="space-y-6">{side}</div>
      </div>
    </div>
  );
}
