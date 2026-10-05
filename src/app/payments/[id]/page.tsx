import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { isHighValue, paymentExceptionModule } from "@/modules/payments/module";
import { paymentExceptionAction } from "@/modules/payments/actions";
import { CaseDetail } from "@/components/shared/CaseDetail";
import { AccessDenied } from "@/components/shared/Page";
import { formatDateTime, formatMoney, maskReference } from "@/lib/format";
import { getLocale } from "@/lib/i18n";
import { createTranslator, type MessageKey } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

export default async function PaymentExceptionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!can(user, "payment:view")) return <AccessDenied required="payment:view" />;
  const { id } = await params;
  const [p, locale] = await Promise.all([paymentExceptionModule.load(id), getLocale()]);
  if (!p) notFound();
  const t = createTranslator(locale);

  return (
    <CaseDetail
      mod={paymentExceptionModule}
      entity={p}
      user={user}
      serverAction={paymentExceptionAction}
      fields={[
        {
          label: t("payment.field.paymentId"),
          value: (
            <span>
              {maskReference(p.paymentId)} <span className="font-sans text-xs text-slate-400">{t("common.masked")}</span>
            </span>
          ),
          mono: true,
        },
        {
          label: t("payment.field.customerId"),
          value: (
            <span>
              {maskReference(p.customerId, 4)} <span className="font-sans text-xs text-slate-400">{t("common.masked")}</span>
            </span>
          ),
          mono: true,
        },
        { label: t("payment.col.amount"), value: <span className="tabular-nums">{formatMoney(p.amount, p.currency)}</span> },
        { label: t("payment.field.method"), value: t(`payment.method.${p.paymentMethod}` as MessageKey) },
        {
          label: t("payment.field.tier"),
          value: isHighValue(p) ? (
            <span>
              {t("payment.tier.high")} <span className="text-slate-500">{t("payment.tier.highNote")}</span>
            </span>
          ) : (
            <span>
              {t("payment.tier.standard")} <span className="text-slate-500">{t("payment.tier.standardNote")}</span>
            </span>
          ),
        },
        { label: t("payment.field.code"), value: <span className="font-mono text-xs">{p.exceptionCode}</span> },
        { label: t("payment.field.reason"), value: p.exceptionReason },
        { label: t("payment.field.occurred"), value: formatDateTime(p.occurredAt, locale) },
      ]}
    />
  );
}
