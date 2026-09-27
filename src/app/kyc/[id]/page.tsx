import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { kycModule } from "@/modules/kyc/module";
import { kycCaseAction } from "@/modules/kyc/actions";
import { CaseDetail } from "@/components/shared/CaseDetail";
import { AccessDenied } from "@/components/shared/Page";
import { RiskBadge } from "@/components/shared/StatusBadge";
import { formatDateTime, maskIdNumber } from "@/lib/format";
import { getLocale } from "@/lib/i18n";
import { createTranslator } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

export default async function KycCasePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!can(user, "kyc:view")) return <AccessDenied required="kyc:view" />;
  const { id } = await params;
  const [c, locale] = await Promise.all([kycModule.load(id), getLocale()]);
  if (!c) notFound();
  const t = createTranslator(locale);

  return (
    <CaseDetail
      mod={kycModule}
      entity={c}
      user={user}
      serverAction={kycCaseAction}
      badges={<RiskBadge level={c.riskLevel} />}
      fields={[
        { label: t("kyc.col.customer"), value: c.customerName },
        {
          label: t("kyc.field.idNumber"),
          value: (
            <span>
              {maskIdNumber(c.idNumber)} <span className="font-sans text-xs text-slate-400">{t("common.masked")}</span>
            </span>
          ),
          mono: true,
        },
        { label: t("kyc.col.country"), value: c.country },
        { label: t("kyc.col.submitted"), value: formatDateTime(c.submittedAt, locale) },
        { label: t("kyc.col.reason"), value: c.reviewReason },
        { label: t("kyc.field.assignedReviewer"), value: c.assignedReviewer },
      ]}
    />
  );
}
