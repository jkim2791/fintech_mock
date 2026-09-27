import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { amountInKrw, isHighValue, refundModule } from "@/modules/refunds/module";
import { refundAction } from "@/modules/refunds/actions";
import { CaseDetail } from "@/components/shared/CaseDetail";
import { AccessDenied } from "@/components/shared/Page";
import { RiskBadge } from "@/components/shared/StatusBadge";
import { formatDateTime, formatMoney, maskReference } from "@/lib/format";
import { getLocale } from "@/lib/i18n";
import { createTranslator } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

export default async function RefundPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!can(user, "refund:view")) return <AccessDenied required="refund:view" />;
  const { id } = await params;
  const [r, locale] = await Promise.all([refundModule.load(id), getLocale()]);
  if (!r) notFound();
  const t = createTranslator(locale);

  return (
    <CaseDetail
      mod={refundModule}
      entity={r}
      user={user}
      serverAction={refundAction}
      badges={<RiskBadge level={r.riskLevel} />}
      fields={[
        { label: t("kyc.col.customer"), value: r.customerName },
        {
          label: t("refund.field.transaction"),
          value: (
            <span>
              {maskReference(r.transactionId)} <span className="font-sans text-xs text-slate-400">{t("common.masked")}</span>
            </span>
          ),
          mono: true,
        },
        {
          label: t("refund.col.amount"),
          value: (
            <span className="tabular-nums">
              {formatMoney(r.amount, r.currency)}
              {r.currency !== "KRW" && <span className="ml-2 text-xs text-slate-500">≈ {formatMoney(amountInKrw(r), "KRW")}</span>}
            </span>
          ),
        },
        {
          label: t("refund.field.tier"),
          value: isHighValue(r) ? (
            <span>
              {t("refund.tier.high")} <span className="text-slate-500">{t("refund.tier.highNote")}</span>
            </span>
          ) : (
            <span>
              {t("refund.tier.standard")} <span className="text-slate-500">{t("refund.tier.standardNote")}</span>
            </span>
          ),
        },
        { label: t("refund.col.requested"), value: formatDateTime(r.requestedAt, locale) },
        { label: t("refund.field.reason"), value: r.reason },
      ]}
    />
  );
}
