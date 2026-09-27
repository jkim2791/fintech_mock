import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { kycModule } from "@/modules/kyc/module";
import { kycCaseAction } from "@/modules/kyc/actions";
import { CaseDetail } from "@/components/shared/CaseDetail";
import { AccessDenied } from "@/components/shared/Page";
import { RiskBadge } from "@/components/shared/StatusBadge";
import { formatDateTime, maskIdNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function KycCasePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!can(user, "kyc:view")) return <AccessDenied required="kyc:view" />;
  const { id } = await params;
  const c = await kycModule.load(id);
  if (!c) notFound();

  return (
    <CaseDetail
      mod={kycModule}
      entity={c}
      user={user}
      serverAction={kycCaseAction}
      badges={<RiskBadge level={c.riskLevel} />}
      fields={[
        { label: "Customer", value: c.customerName },
        {
          label: "Identification number",
          value: (
            <span>
              {maskIdNumber(c.idNumber)} <span className="font-sans text-xs text-slate-400">masked</span>
            </span>
          ),
          mono: true,
        },
        { label: "Country", value: c.country },
        { label: "Submitted", value: formatDateTime(c.submittedAt) },
        { label: "Review reason", value: c.reviewReason },
        { label: "Assigned reviewer", value: c.assignedReviewer },
      ]}
    />
  );
}
