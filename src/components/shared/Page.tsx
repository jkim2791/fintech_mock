import type { ReactNode } from "react";
import { LockIcon } from "./Icons";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-5">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function SectionHeader({ title, meta, actions }: { title: string; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {meta && <span className="text-xs text-slate-500">{meta}</span>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ title, meta, children, className = "" }: { title?: string; meta?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-md border border-slate-200 bg-white ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {meta && <span className="text-xs text-slate-500">{meta}</span>}
        </header>
      )}
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

export function AccessDenied({ required }: { required: string }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-md border border-slate-200 bg-white p-6 text-center">
      <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500">
        <LockIcon size={16} />
      </div>
      <h1 className="mt-3 text-sm font-semibold text-slate-900">Access denied</h1>
      <p className="mt-1 text-sm leading-relaxed text-slate-500">
        Your role does not hold <code className="rounded bg-slate-100 px-1 font-mono text-xs text-slate-700">{required}</code>. This check runs on
        the server, not in the browser.
      </p>
    </div>
  );
}
