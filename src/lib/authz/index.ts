import type { AuthUser } from "@/lib/auth/types";
import { hasPermission, rolesWithPermission, type Permission } from "./permissions";

export { hasPermission, rolesWithPermission, PERMISSIONS, ROLE_PERMISSIONS } from "./permissions";
export type { Permission } from "./permissions";

export class AuthorizationError extends Error {
  readonly permission: Permission;
  constructor(user: AuthUser, permission: Permission) {
    super(
      `${user.role} is not permitted to perform '${permission}'. Requires: ${rolesWithPermission(permission).join(" or ")}.`,
    );
    this.name = "AuthorizationError";
    this.permission = permission;
  }
}

/** Server-side gate. Throws; never rely on UI hiding alone. */
export function authorize(user: AuthUser, permission: Permission): void {
  if (!hasPermission(user.role, permission)) throw new AuthorizationError(user, permission);
}

export function can(user: AuthUser, permission: Permission): boolean {
  return hasPermission(user.role, permission);
}
