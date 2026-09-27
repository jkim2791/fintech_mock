export const ROLES = ["OPS_ANALYST", "COMPLIANCE_APPROVER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
}

/**
 * Identity abstraction used by every module. Business code only ever talks to
 * this interface; swapping DEMO_MODE for Microsoft Entra ID means providing a
 * new implementation, not touching KYC / Refund code.
 */
export interface AuthProvider {
  readonly name: string;
  /** Resolve the user for the current request, or null if unauthenticated. */
  getCurrentUser(): Promise<AuthUser | null>;
  /** Users the UI may switch between. Only meaningful for the demo provider. */
  listSwitchableUsers(): Promise<AuthUser[]>;
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
