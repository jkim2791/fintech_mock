import type { PaymentException } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CaseAction, CaseModule } from "@/lib/workflow/types";
import { formatMoney } from "@/lib/format";

/** Demo policy: resolving (approving) an exception above this KRW amount needs a compliance approver. */
export const HIGH_VALUE_THRESHOLD_KRW = 1_000_000;

export const PAYMENT_METHODS = ["CARD", "BANK_TRANSFER", "VIRTUAL_ACCOUNT", "MOBILE_WALLET"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const EXCEPTION_CODES = ["SETTLEMENT_MISMATCH", "DUPLICATE_CAPTURE", "UNCONFIRMED_DEBIT", "PG_TIMEOUT", "VELOCITY_LIMIT"] as const;
export type ExceptionCode = (typeof EXCEPTION_CODES)[number];

/** The demo dataset is KRW-only, so the threshold compares amounts directly. */
export function isHighValue(p: Pick<PaymentException, "amount">): boolean {
  return p.amount > HIGH_VALUE_THRESHOLD_KRW;
}

const AUDIT_SUFFIX: Record<CaseAction, string> = {
  NOTE: "NOTE_ADDED",
  ESCALATE: "ESCALATED",
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
};

export const paymentExceptionModule: CaseModule<PaymentException> = {
  entityType: "PAYMENT_EXCEPTION",
  label: "Payment exception",
  basePath: "/payments",
  load: (id) => prisma.paymentException.findUnique({ where: { id } }),
  requiredPermission(action, p) {
    switch (action) {
      case "NOTE":
        return "payment:note";
      case "ESCALATE":
        return "payment:escalate";
      case "APPROVE":
        return isHighValue(p) ? "payment:approve_high_value" : "payment:approve";
      case "REJECT":
        return "payment:reject";
    }
  },
  policyNote(action, p, t) {
    if (action === "APPROVE" && isHighValue(p)) {
      return t("payment.policy.highValue", { amount: formatMoney(HIGH_VALUE_THRESHOLD_KRW, "KRW") });
    }
    return null;
  },
  async updateStatus(tx, id, status) {
    await tx.paymentException.update({ where: { id }, data: { status } });
  },
  auditAction: (action) => `PAYMENT_EXCEPTION_${AUDIT_SUFFIX[action]}`,
};
