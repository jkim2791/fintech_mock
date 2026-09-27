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
  { key: "id", header: "Refund", render: (r) => <Link href={`/refunds/${r.id}`} className="whitespace-nowrap font-mono text-xs font-medium underline">{r.id}</Link> },
  { key: "txn", header: "Transaction", render: (r) => <span className="font-mono text-xs text-slate-600">{maskReference(r.transactionId)}</span> },
  { key: "customer", header: "Customer", render: (r) => r.customerName },
  {
    key: "amount",
    header: "Amount",
    render: (r) => (
      <span className="flex items-center gap-2 whitespace-nowrap tabular-nums">
        {formatMoney(r.amount, r.currency)}
        {isHighValue(r) && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">approver required</span>}
      </span>
    ),
  },
  { key: "reason", header: "Reason", render: (r) => <span className="text-slate-600">{r.reason}</span>, className: "max-w-xs" },
  { key: "risk", header: "Risk", render: (r) => <RiskBadge level={r.riskLevel} /> },
  { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  { key: "requested", header: "Requested", render: (r) => <span className="whitespace-nowrap text-slate-600">{formatDate(r.requestedAt)}</span> },
];

export default async function RefundQueuePage({ searchParams }: { searchParams: Promise<{ status?: string; risk?: string }> }) {
  const user = await requireUser();
  if (!can(user, "refund:view")) return <AccessDenied required="refund:view" />;
  const params = await searchParams;
  const refunds = await listRefunds(params);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Refund Operations"
        description={`Refund request queue. Refunds above ${formatMoney(HIGH_VALUE_THRESHOLD_KRW, "KRW")} require a compliance approver.`}
      />
      <FilterBar
        filters={[
          { name: "status", label: "Status", options: REVIEW_STATUSES },
          { name: "risk", label: "Risk level", options: RISK_LEVELS },
        ]}
      />
      <DataTable columns={columns} rows={refunds} />
    </div>
  );
}
