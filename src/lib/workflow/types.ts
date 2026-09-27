import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@/lib/auth/types";
import type { Permission } from "@/lib/authz";
import type { EntityType } from "@/lib/audit";

export const REVIEW_STATUSES = ["PENDING_REVIEW", "ESCALATED", "APPROVED", "REJECTED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const CASE_ACTIONS = ["NOTE", "ESCALATE", "APPROVE", "REJECT"] as const;
export type CaseAction = (typeof CASE_ACTIONS)[number];

export function isCaseAction(v: string): v is CaseAction {
  return (CASE_ACTIONS as readonly string[]).includes(v);
}

/** Status transitions shared by every review-style module. */
export const TRANSITIONS: Record<Exclude<CaseAction, "NOTE">, { from: ReviewStatus[]; to: ReviewStatus }> = {
  ESCALATE: { from: ["PENDING_REVIEW"], to: "ESCALATED" },
  APPROVE: { from: ["PENDING_REVIEW", "ESCALATED"], to: "APPROVED" },
  REJECT: { from: ["PENDING_REVIEW", "ESCALATED"], to: "REJECTED" },
};

export const ACTIONS_REQUIRING_REASON: CaseAction[] = ["ESCALATE", "APPROVE", "REJECT"];

/**
 * Everything the generic workflow engine needs to know about a module.
 * KYC and Refunds each provide one of these; the engine, UI, audit and
 * authorization code are shared.
 */
export interface CaseModule<T extends { id: string; status: string }> {
  entityType: Exclude<EntityType, "SYSTEM">;
  label: string;
  basePath: string;
  load(id: string): Promise<T | null>;
  /** Module policy: which permission does this action need for this entity? */
  requiredPermission(action: CaseAction, entity: T): Permission;
  /** Human-readable explanation of the policy, shown next to locked actions. */
  policyNote(action: CaseAction, entity: T): string | null;
  updateStatus(tx: Prisma.TransactionClient, id: string, status: ReviewStatus): Promise<void>;
  auditAction(action: CaseAction): string;
}

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

export interface ActionRequest {
  entityId: string;
  action: CaseAction;
  reason: string;
  user: AuthUser;
}
