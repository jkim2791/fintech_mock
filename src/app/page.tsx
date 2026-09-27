import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PERMISSIONS, can } from "@/lib/authz";
import { kycSummary } from "@/modules/kyc/queries";
import { refundSummary } from "@/modules/refunds/queries";
import { listAuditEvents } from "@/lib/audit";
import { PageHeader, SectionHeader } from "@/components/shared/Page";
import { AuditTable } from "@/components/shared/AuditTable";
import { ArrowRightIcon, CheckIcon } from "@/components/shared/Icons";
import { REVIEW_STATUSES } from "@/lib/workflow/types";
import { getT } from "@/lib/i18n";
import type { MessageKey, Translator } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

const STATUS_DOTS: Record<string, string> = {
  PENDING_REVIEW: "bg-sky-500",
  ESCALATED: "bg-amber-500",
  APPROVED: "bg-emerald-500",
  REJECTED: "bg-rose-500",
};

function QueueSummary({ title, description, href, counts, t }: { title: string; description: string; href: string; counts: Record<string, number>; t: Translator }) {
  const open = (counts.PENDING_REVIEW ?? 0) + (counts.ESCALATED ?? 0);
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900">
          {t("overview.openQueue")}
          <ArrowRightIcon size={12} />
        </Link>
      </header>
      <div className="grid grid-cols-4 divide-x divide-slate-100">
        {REVIEW_STATUSES.map((s) => (
          <Link key={s} href={`${href}?status=${s}`} className="px-4 py-3 hover:bg-slate-50">
            <div className="text-xl font-semibold tabular-nums tracking-tight text-slate-900">{counts[s] ?? 0}</div>
            <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[s]}`} />
              {t(`status.${s}` as MessageKey)}
            </div>
          </Link>
        ))}
      </div>
      <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
        <span className="font-medium tabular-nums text-slate-700">{open}</span> {t("overview.awaiting")}
      </div>
    </section>
  );
}

export default async function Overview() {
  const user = await requireUser();
  const t = await getT();
  const [kyc, refunds, recent] = await Promise.all([
    kycSummary(),
    refundSummary(),
    can(user, "audit:view") ? listAuditEvents({ limit: 8 }) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("overview.title")}
        description={t("overview.description")}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {can(user, "kyc:view") && <QueueSummary title={t("nav.kyc")} description={t("overview.kycSubtitle")} href="/kyc" counts={kyc} t={t} />}
        {can(user, "refund:view") && <QueueSummary title={t("nav.refunds")} description={t("overview.refundSubtitle")} href="/refunds" counts={refunds} t={t} />}
      </div>

      <section>
        <SectionHeader title={t("overview.permissions")} meta={t("overview.permissionsMeta", { role: user.role })} />
        <ul className="grid grid-cols-2 gap-x-6 rounded-md border border-slate-200 bg-white px-4 py-2 md:grid-cols-3">
          {PERMISSIONS.map((p) => {
            const granted = can(user, p);
            return (
              <li key={p} className="flex items-center gap-2 border-b border-slate-100 py-1.5 last:border-0 md:[&:nth-last-child(-n+3)]:border-0">
                <span className={`grid h-4 w-4 place-items-center rounded-full ${granted ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-300"}`}>
                  {granted ? <CheckIcon size={10} strokeWidth={2} /> : <span className="h-px w-1.5 bg-current" />}
                </span>
                <code className={`font-mono text-xs ${granted ? "text-slate-800" : "text-slate-400"}`}>{p}</code>
              </li>
            );
          })}
        </ul>
      </section>

      {can(user, "audit:view") && (
        <section>
          <SectionHeader
            title={t("overview.recentAudit")}
            actions={
              <Link href="/audit" className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900">
                {t("overview.fullAudit")}
                <ArrowRightIcon size={12} />
              </Link>
            }
          />
          <AuditTable events={recent} />
        </section>
      )}
    </div>
  );
}
