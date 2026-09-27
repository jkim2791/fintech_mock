import Link from "next/link";
import type { KycCase } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { listKycCases } from "@/modules/kyc/queries";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { FilterBar } from "@/components/shared/FilterBar";
import { AccessDenied, PageHeader } from "@/components/shared/Page";
import { RiskBadge, StatusBadge } from "@/components/shared/StatusBadge";
import { REVIEW_STATUSES, RISK_LEVELS } from "@/lib/workflow/types";
import { formatDate, maskIdNumber } from "@/lib/format";
import { count, getLocale, riskLabels, statusLabels } from "@/lib/i18n";
import { createTranslator, type Locale, type Translator } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

const columns = (t: Translator, locale: Locale): Column<KycCase>[] => [
  {
    key: "id",
    header: t("kyc.col.case"),
    render: (c) => (
      <Link href={`/kyc/${c.id}`} className="whitespace-nowrap font-mono text-xs font-medium text-slate-900 hover:underline">
        {c.id}
      </Link>
    ),
  },
  {
    key: "customer",
    header: t("kyc.col.customer"),
    render: (c) => (
      <div className="leading-tight">
        <div className="whitespace-nowrap text-slate-900">{c.customerName}</div>
        <div className="mt-0.5 font-mono text-[11px] text-slate-500">{maskIdNumber(c.idNumber)}</div>
      </div>
    ),
  },
  { key: "country", header: t("kyc.col.country"), render: (c) => <span className="font-mono text-xs text-slate-600">{c.country}</span> },
  { key: "risk", header: t("kyc.col.risk"), render: (c) => <RiskBadge level={c.riskLevel} /> },
  { key: "status", header: t("kyc.col.status"), render: (c) => <StatusBadge status={c.status} /> },
  { key: "reason", header: t("kyc.col.reason"), render: (c) => <span className="block max-w-xs text-[13px] leading-snug text-slate-600">{c.reviewReason}</span> },
  { key: "reviewer", header: t("kyc.col.reviewer"), render: (c) => <span className="whitespace-nowrap text-slate-700">{c.assignedReviewer}</span> },
  { key: "submitted", header: t("kyc.col.submitted"), render: (c) => <span className="whitespace-nowrap text-xs text-slate-500">{formatDate(c.submittedAt, locale)}</span>, align: "right" },
];

export default async function KycQueuePage({ searchParams }: { searchParams: Promise<{ status?: string; risk?: string }> }) {
  const user = await requireUser();
  if (!can(user, "kyc:view")) return <AccessDenied required="kyc:view" />;
  const params = await searchParams;
  const [cases, locale] = await Promise.all([listKycCases(params), getLocale()]);
  const t = createTranslator(locale);

  return (
    <div className="space-y-5">
      <PageHeader title={t("kyc.title")} description={t("kyc.description")} />
      <FilterBar
        filters={[
          { name: "status", label: t("filter.status"), options: REVIEW_STATUSES, labels: statusLabels(t) },
          { name: "risk", label: t("filter.risk"), options: RISK_LEVELS, labels: riskLabels(t) },
        ]}
        summary={count(t, cases.length, "common.count.case", "common.count.cases")}
      />
      <DataTable columns={columns(t, locale)} rows={cases} />
    </div>
  );
}
