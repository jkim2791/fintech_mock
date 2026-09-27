import type { Role } from "@/lib/auth/types";

/**
 * Fine-grained permissions. Modules ask "does this role hold permission X?";
 * they never check role names directly, so adding a role or reshaping the
 * matrix does not touch module code.
 */
export const PERMISSIONS = [
  "kyc:view",
  "kyc:note",
  "kyc:escalate",
  "kyc:approve",
  "kyc:approve_high_risk",
  "kyc:reject",
  "refund:view",
  "refund:note",
  "refund:escalate",
  "refund:approve",
  "refund:approve_high_value",
  "refund:reject",
  "audit:view",
  "admin:access",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// Analysts handle the standard tier; HIGH-risk KYC and high-value refunds are
// reserved for the checker roles (maker-checker).
const ANALYST: Permission[] = [
  "kyc:view",
  "kyc:note",
  "kyc:escalate",
  "kyc:approve",
  "kyc:reject",
  "refund:view",
  "refund:note",
  "refund:escalate",
  "refund:approve",
  "refund:reject",
];

const APPROVER: Permission[] = [...ANALYST, "kyc:approve_high_risk", "refund:approve_high_value", "audit:view"];

export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  OPS_ANALYST: new Set(ANALYST),
  COMPLIANCE_APPROVER: new Set(APPROVER),
  ADMIN: new Set([...APPROVER, "admin:access"]),
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function rolesWithPermission(permission: Permission): Role[] {
  return (Object.keys(ROLE_PERMISSIONS) as Role[]).filter((r) =>
    ROLE_PERMISSIONS[r].has(permission),
  );
}
