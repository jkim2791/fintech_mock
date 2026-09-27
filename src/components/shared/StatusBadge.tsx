import { getT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";

/* Status: neutral text with a semantic dot — readable in dense tables without
   turning every row into a wall of colour. */
const STATUS_DOTS: Record<string, string> = {
  PENDING_REVIEW: "bg-sky-500",
  ESCALATED: "bg-amber-500",
  APPROVED: "bg-emerald-500",
  REJECTED: "bg-rose-500",
};

/* Risk is the one signal that earns a filled tag: reviewers scan for it. */
const RISK_STYLES: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-800",
  HIGH: "bg-rose-50 text-rose-700",
};

export async function StatusBadge({ status }: { status: string }) {
  const t = await getT();
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-slate-700">
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status] ?? "bg-slate-400"}`} />
      {t(`status.${status}` as MessageKey)}
    </span>
  );
}

export async function RiskBadge({ level }: { level: string }) {
  const t = await getT();
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded px-1.5 py-px text-[11px] font-medium uppercase tracking-wide ${
        RISK_STYLES[level] ?? RISK_STYLES.LOW
      }`}
    >
      {t(`risk.badge.${level}` as MessageKey)}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded border border-slate-200 bg-white px-1.5 py-px font-mono text-[10.5px] text-slate-500">
      {role}
    </span>
  );
}
