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

export const dynamic = "force-dynamic";

const columns: Column<RefundCase>[] = [
  {
    key: "id",
    header: "Refund",
    render: (r) => (
      <Link href={`/refunds/${r.id}`} className="whitespace-nowrap font-mono text-xs font-medium text-slate-900 hover:underline">
        {r.id}
      </Link>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    render: (r) => (
      <div className="leading-tight">
        <div className="whitespace-nowrap text-slate-900">{r.customerName}</div>
        <div className="mt-0.5 whitespace-nowrap font-mono text-[11px] text-slate-500">{maskReference(r.transactionId)}</div>
      </div>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    align: "right",
    render: (r) => (
      <div className="leading-tight">
        <div className="whitespace-nowrap font-medium tabular-nums text-slate-900">{formatMoney(r.amount, r.currency)}</div>
        {isHighValue(r) && <div className="mt-0.5 whitespace-nowrap text-[11px] text-amber-700">Approver required</div>}
      </div>
    ),
  },
  { key: "reason", header: "Reason", render: (r) => <span className="block max-w-xs text-[13px] leading-snug text-slate-600">{r.reason}</span> },
  { key: "risk", header: "Risk", render: (r) => <RiskBadge level={r.riskLevel} /> },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  { key: "requested", header: "Requested", render: (r) => <span className="whitespace-nowrap text-xs text-slate-500">{formatDate(r.requestedAt)}</span>, align: "right" },
];

export default async function RefundQueuePage({ searchParams }: { searchParams: Promise<{ status?: string; risk?: string }> }) {
  const user = await requireUser();
  if (!can(user, "refund:view")) return <AccessDenied required="refund:view" />;
  const params = await searchParams;
  const refunds = await listRefunds(params);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Refund Operations"
        description={`Refund request queue. Refunds above ${formatMoney(HIGH_VALUE_THRESHOLD_KRW, "KRW")} require a compliance approver.`}
      />
      <FilterBar
        filters={[
          { name: "status", label: "Status", options: REVIEW_STATUSES },
          { name: "risk", label: "Risk", options: RISK_LEVELS },
        ]}
        summary={`${refunds.length} ${refunds.length === 1 ? "refund" : "refunds"}`}
      />
      <DataTable columns={columns} rows={refunds} />
    </div>
  );
}
