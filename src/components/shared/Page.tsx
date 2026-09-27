import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${className}`}>
      {title && <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-medium">{title}</h2>}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function AccessDenied({ required }: { required: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
      <div className="font-medium">Access denied</div>
      <p className="mt-1">Your role does not hold the <code className="font-mono">{required}</code> permission. This check runs on the server.</p>
    </div>
  );
}
