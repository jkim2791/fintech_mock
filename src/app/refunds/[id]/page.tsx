import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { amountInKrw, isHighValue, refundModule } from "@/modules/refunds/module";
import { refundAction } from "@/modules/refunds/actions";
import { CaseDetail } from "@/components/shared/CaseDetail";
import { AccessDenied } from "@/components/shared/Page";
import { RiskBadge } from "@/components/shared/StatusBadge";
import { formatDateTime, formatMoney, maskReference } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RefundPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!can(user, "refund:view")) return <AccessDenied required="refund:view" />;
  const { id } = await params;
  const r = await refundModule.load(id);
  if (!r) notFound();

  return (
    <CaseDetail
      mod={refundModule}
      entity={r}
      user={user}
      serverAction={refundAction}
      badges={<RiskBadge level={r.riskLevel} />}
      fields={[
        { label: "Customer", value: r.customerName },
        {
          label: "Transaction",
          value: (
            <span>
              {maskReference(r.transactionId)} <span className="font-sans text-xs text-slate-400">masked</span>
            </span>
          ),
          mono: true,
        },
        {
          label: "Amount",
          value: (
            <span className="tabular-nums">
              {formatMoney(r.amount, r.currency)}
              {r.currency !== "KRW" && <span className="ml-2 text-xs text-slate-500">≈ {formatMoney(amountInKrw(r), "KRW")}</span>}
            </span>
          ),
        },
        {
          label: "Approval tier",
          value: isHighValue(r) ? (
            <span>
              High value <span className="text-slate-500">· requires COMPLIANCE_APPROVER or ADMIN</span>
            </span>
          ) : (
            <span>
              Standard <span className="text-slate-500">· any reviewer may decide</span>
            </span>
          ),
        },
        { label: "Requested", value: formatDateTime(r.requestedAt) },
        { label: "Refund reason", value: r.reason },
      ]}
    />
  );
}
