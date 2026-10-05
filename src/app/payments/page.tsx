import Link from "next/link";
import type { PaymentException } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { listPaymentExceptions } from "@/modules/payments/queries";
import { EXCEPTION_CODES, HIGH_VALUE_THRESHOLD_KRW, PAYMENT_METHODS, isHighValue } from "@/modules/payments/module";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { FilterBar } from "@/components/shared/FilterBar";
import { AccessDenied, PageHeader } from "@/components/shared/Page";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { REVIEW_STATUSES } from "@/lib/workflow/types";
import { formatDate, formatMoney, maskReference } from "@/lib/format";
import { count, getLocale, statusLabels } from "@/lib/i18n";
import { createTranslator, type Locale, type MessageKey, type Translator } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

const codeLabels = (t: Translator) => Object.fromEntries(EXCEPTION_CODES.map((c) => [c, t(`payment.code.${c}` as MessageKey)]));
const methodLabels = (t: Translator) => Object.fromEntries(PAYMENT_METHODS.map((m) => [m, t(`payment.method.${m}` as MessageKey)]));

const columns = (t: Translator, locale: Locale): Column<PaymentException>[] => [
  {
    key: "id",
    header: t("payment.col.exception"),
    render: (p) => (
      <Link href={`/payments/${p.id}`} className="whitespace-nowrap font-mono text-xs font-medium text-slate-900 hover:underline">
        {p.id}
      </Link>
    ),
  },
  {
    key: "payment",
    header: t("payment.col.payment"),
    render: (p) => (
      <div className="leading-tight">
        <div className="whitespace-nowrap font-mono text-xs text-slate-900">{maskReference(p.paymentId)}</div>
        <div className="mt-0.5 whitespace-nowrap font-mono text-[11px] text-slate-500">{maskReference(p.customerId, 4)}</div>
      </div>
    ),
  },
  {
    key: "amount",
    header: t("payment.col.amount"),
    align: "right",
    render: (p) => (
      <div className="leading-tight">
        <div className="whitespace-nowrap font-medium tabular-nums text-slate-900">{formatMoney(p.amount, p.currency)}</div>
        {isHighValue(p) && <div className="mt-0.5 whitespace-nowrap text-[11px] text-amber-700">{t("payment.approverRequired")}</div>}
      </div>
    ),
  },
  { key: "method", header: t("payment.col.method"), render: (p) => <span className="whitespace-nowrap text-[13px] text-slate-700">{methodLabels(t)[p.paymentMethod] ?? p.paymentMethod}</span> },
  {
    key: "exception",
    header: t("payment.col.code"),
    render: (p) => (
      <div className="max-w-xs leading-snug">
        <div className="text-[13px] font-medium text-slate-800">{codeLabels(t)[p.exceptionCode] ?? p.exceptionCode}</div>
        <div className="mt-0.5 text-[12px] text-slate-500">{p.exceptionReason}</div>
      </div>
    ),
  },
  { key: "status", header: t("kyc.col.status"), render: (p) => <StatusBadge status={p.status} /> },
  { key: "occurred", header: t("payment.col.occurred"), render: (p) => <span className="whitespace-nowrap text-xs text-slate-500">{formatDate(p.occurredAt, locale)}</span>, align: "right" },
];

export default async function PaymentExceptionQueuePage({ searchParams }: { searchParams: Promise<{ status?: string; method?: string; code?: string }> }) {
  const user = await requireUser();
  if (!can(user, "payment:view")) return <AccessDenied required="payment:view" />;
  const params = await searchParams;
  const [exceptions, locale] = await Promise.all([listPaymentExceptions(params), getLocale()]);
  const t = createTranslator(locale);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("payment.title")}
        description={t("payment.description", { amount: formatMoney(HIGH_VALUE_THRESHOLD_KRW, "KRW") })}
      />
      <FilterBar
        filters={[
          { name: "status", label: t("filter.status"), options: REVIEW_STATUSES, labels: statusLabels(t) },
          { name: "method", label: t("filter.method"), options: PAYMENT_METHODS, labels: methodLabels(t) },
          { name: "code", label: t("filter.exceptionCode"), options: EXCEPTION_CODES, labels: codeLabels(t) },
        ]}
        summary={count(t, exceptions.length, "common.count.exception", "common.count.exceptions")}
      />
      <DataTable columns={columns(t, locale)} rows={exceptions} />
    </div>
  );
}
