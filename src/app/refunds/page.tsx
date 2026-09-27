import Link from "next/link";
import type { RefundCase } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { listRefunds } from "@/modules/refunds/queries";
import { HIGH_VALUE_THRESHOLD_KRW, isHighValue } from "@/modules/refunds/module";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { FilterBar } from "@/components/shared/FilterBar";
import { AccessDenied, PageHeader } from "@/components/shared/Page";
import { RiskBadge, StatusBadge } from "@/components/shared/StatusBadge";
import { REVIEW_STATUSES, RISK_LEVELS } from "@/lib/workflow/types";
import { formatDate, formatMoney, maskReference } from "@/lib/format";
import { count, getLocale, riskLabels, statusLabels } from "@/lib/i18n";
import { createTranslator, type Locale, type Translator } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

const columns = (t: Translator, locale: Locale): Column<RefundCase>[] => [
  {
    key: "id",
    header: t("refund.col.refund"),
    render: (r) => (
      <Link href={`/refunds/${r.id}`} className="whitespace-nowrap font-mono text-xs font-medium text-slate-900 hover:underline">
        {r.id}
      </Link>
    ),
  },
  {
    key: "customer",
    header: t("kyc.col.customer"),
    render: (r) => (
      <div className="leading-tight">
        <div className="whitespace-nowrap text-slate-900">{r.customerName}</div>
        <div className="mt-0.5 whitespace-nowrap font-mono text-[11px] text-slate-500">{maskReference(r.transactionId)}</div>
      </div>
    ),
  },
  {
    key: "amount",
    header: t("refund.col.amount"),
    align: "right",
    render: (r) => (
      <div className="leading-tight">
        <div className="whitespace-nowrap font-medium tabular-nums text-slate-900">{formatMoney(r.amount, r.currency)}</div>
        {isHighValue(r) && <div className="mt-0.5 whitespace-nowrap text-[11px] text-amber-700">{t("refund.approverRequired")}</div>}
      </div>
    ),
  },
  { key: "reason", header: t("refund.col.reason"), render: (r) => <span className="block max-w-xs text-[13px] leading-snug text-slate-600">{r.reason}</span> },
  { key: "risk", header: t("kyc.col.risk"), render: (r) => <RiskBadge level={r.riskLevel} /> },
  { key: "status", header: t("kyc.col.status"), render: (r) => <StatusBadge status={r.status} /> },
  { key: "requested", header: t("refund.col.requested"), render: (r) => <span className="whitespace-nowrap text-xs text-slate-500">{formatDate(r.requestedAt, locale)}</span>, align: "right" },
];

export default async function RefundQueuePage({ searchParams }: { searchParams: Promise<{ status?: string; risk?: string }> }) {
  const user = await requireUser();
  if (!can(user, "refund:view")) return <AccessDenied required="refund:view" />;
  const params = await searchParams;
  const [refunds, locale] = await Promise.all([listRefunds(params), getLocale()]);
  const t = createTranslator(locale);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("refund.title")}
        description={t("refund.description", { amount: formatMoney(HIGH_VALUE_THRESHOLD_KRW, "KRW") })}
      />
      <FilterBar
        filters={[
          { name: "status", label: t("filter.status"), options: REVIEW_STATUSES, labels: statusLabels(t) },
          { name: "risk", label: t("filter.risk"), options: RISK_LEVELS, labels: riskLabels(t) },
        ]}
        summary={count(t, refunds.length, "common.count.refund", "common.count.refunds")}
      />
      <DataTable columns={columns(t, locale)} rows={refunds} />
    </div>
  );
}
