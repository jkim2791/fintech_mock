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

export const dynamic = "force-dynamic";

const columns: Column<KycCase>[] = [
  { key: "id", header: "Case", render: (c) => <Link href={`/kyc/${c.id}`} className="whitespace-nowrap font-mono text-xs font-medium underline">{c.id}</Link> },
  { key: "customer", header: "Customer", render: (c) => c.customerName },
  { key: "idn", header: "ID number", render: (c) => <span className="font-mono text-xs text-slate-600">{maskIdNumber(c.idNumber)}</span> },
  { key: "country", header: "Country", render: (c) => c.country },
  { key: "risk", header: "Risk", render: (c) => <RiskBadge level={c.riskLevel} /> },
  { key: "status", header: "Status", render: (c) => <StatusBadge status={c.status} /> },
  { key: "reason", header: "Review reason", render: (c) => <span className="text-slate-600">{c.reviewReason}</span>, className: "max-w-xs" },
  { key: "reviewer", header: "Reviewer", render: (c) => c.assignedReviewer },
  { key: "submitted", header: "Submitted", render: (c) => <span className="whitespace-nowrap text-slate-600">{formatDate(c.submittedAt)}</span> },
];

export default async function KycQueuePage({ searchParams }: { searchParams: Promise<{ status?: string; risk?: string }> }) {
  const user = await requireUser();
  if (!can(user, "kyc:view")) return <AccessDenied required="kyc:view" />;
  const params = await searchParams;
  const cases = await listKycCases(params);

  return (
    <div className="space-y-4">
      <PageHeader title="KYC Review" description="Customer identity verification queue. HIGH-risk approvals require a compliance approver." />
      <FilterBar
        filters={[
          { name: "status", label: "Status", options: REVIEW_STATUSES },
          { name: "risk", label: "Risk level", options: RISK_LEVELS },
        ]}
      />
      <DataTable columns={columns} rows={cases} />
    </div>
  );
}
