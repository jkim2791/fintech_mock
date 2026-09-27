import type { RefundCase } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CaseModule } from "@/lib/workflow/types";
import { formatMoney } from "@/lib/format";

/** Demo policy: refunds above this KRW amount need a compliance approver. */
export const HIGH_VALUE_THRESHOLD_KRW = 500_000;

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
  policyNote(action, r) {
    if (action === "APPROVE" && isHighValue(r)) {
      return `Refunds above ${formatMoney(HIGH_VALUE_THRESHOLD_KRW, "KRW")} require a compliance approver.`;
    }
    return null;
  },
  async updateStatus(tx, id, status) {
    await tx.refundCase.update({ where: { id }, data: { status } });
  },
  auditAction: (action) => `REFUND_${action === "NOTE" ? "NOTE_ADDED" : action + "D"}`,
};
