import type { RefundCase } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CaseAction, CaseModule } from "@/lib/workflow/types";
import { formatMoney } from "@/lib/format";

/** Demo policy: refunds above this KRW amount need a compliance approver. */
export const HIGH_VALUE_THRESHOLD_KRW = 500_000;

const AUDIT_SUFFIX: Record<CaseAction, string> = {
  NOTE: "NOTE_ADDED",
  ESCALATE: "ESCALATED",
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
};

/** Rough demo conversion so non-KRW refunds can be compared to the KRW threshold. */
const KRW_RATES: Record<string, number> = { KRW: 1, USD: 1400, JPY: 9.3, EUR: 1500 };

export function amountInKrw(r: Pick<RefundCase, "amount" | "currency">): number {
  return Math.round(r.amount * (KRW_RATES[r.currency] ?? 1));
}

export function isHighValue(r: Pick<RefundCase, "amount" | "currency">): boolean {
  return amountInKrw(r) > HIGH_VALUE_THRESHOLD_KRW;
}

export const refundModule: CaseModule<RefundCase> = {
  entityType: "REFUND",
  label: "Refund",
  basePath: "/refunds",
  load: (id) => prisma.refundCase.findUnique({ where: { id } }),
  requiredPermission(action, r) {
    switch (action) {
      case "NOTE":
        return "refund:note";
      case "ESCALATE":
        return "refund:escalate";
      case "APPROVE":
        return isHighValue(r) ? "refund:approve_high_value" : "refund:approve";
      case "REJECT":
        return "refund:reject";
    }
  },
  policyNote(action, r, t) {
    if (action === "APPROVE" && isHighValue(r)) {
      return t("refund.policy.highValue", { amount: formatMoney(HIGH_VALUE_THRESHOLD_KRW, "KRW") });
    }
    return null;
  },
  async updateStatus(tx, id, status) {
    await tx.refundCase.update({ where: { id }, data: { status } });
  },
  auditAction: (action) => `REFUND_${AUDIT_SUFFIX[action]}`,
};
