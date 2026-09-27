import type { KycCase } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CaseModule } from "@/lib/workflow/types";

export const HIGH_RISK_LEVEL = "HIGH";

/**
 * KYC policy: maker-checker on HIGH-risk cases. Approving a HIGH-risk case
 * requires `kyc:approve_high_risk`, which OPS_ANALYST does not hold.
 */
export const kycModule: CaseModule<KycCase> = {
  entityType: "KYC_CASE",
  label: "KYC case",
  basePath: "/kyc",
  load: (id) => prisma.kycCase.findUnique({ where: { id } }),
  requiredPermission(action, c) {
    switch (action) {
      case "NOTE":
        return "kyc:note";
      case "ESCALATE":
        return "kyc:escalate";
      case "APPROVE":
        return c.riskLevel === HIGH_RISK_LEVEL ? "kyc:approve_high_risk" : "kyc:approve";
      case "REJECT":
        return "kyc:reject";
    }
  },
  policyNote(action, c, t) {
    if (action === "APPROVE" && c.riskLevel === HIGH_RISK_LEVEL) {
      return t("kyc.policy.highRisk");
    }
    return null;
  },
  async updateStatus(tx, id, status) {
    await tx.kycCase.update({ where: { id }, data: { status } });
  },
  auditAction: (action) => `KYC_CASE_${action === "NOTE" ? "NOTE_ADDED" : action + "D"}`,
};
