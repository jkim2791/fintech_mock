import { humanize } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  PENDING_REVIEW: "bg-sky-50 text-sky-700 ring-sky-200",
  ESCALATED: "bg-amber-50 text-amber-800 ring-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
};

const RISK_STYLES: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700 ring-slate-200",
  MEDIUM: "bg-amber-50 text-amber-800 ring-amber-200",
  HIGH: "bg-rose-50 text-rose-700 ring-rose-200",
};

const ROLE_STYLES: Record<string, string> = {
  OPS_ANALYST: "bg-slate-100 text-slate-700 ring-slate-200",
  COMPLIANCE_APPROVER: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  ADMIN: "bg-violet-50 text-violet-700 ring-violet-200",
};

function Badge({ text, className }: { text: string; className: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
      {text}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge text={humanize(status)} className={STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 ring-slate-200"} />;
}

export function RiskBadge({ level }: { level: string }) {
  return <Badge text={`${level} risk`} className={RISK_STYLES[level] ?? RISK_STYLES.LOW} />;
}

export function RoleBadge({ role }: { role: string }) {
  return <Badge text={role} className={ROLE_STYLES[role] ?? ROLE_STYLES.OPS_ANALYST} />;
}
