import { cookies } from "next/headers";
import type { AuthProvider, AuthUser } from "./types";
import { DEMO_USERS, DEFAULT_DEMO_USER_ID } from "./demo-users";

export const DEMO_USER_COOKIE = "demo_user_id";

/**
 * DEMO_MODE identity provider. The "session" is a plain cookie naming one of
 * the fixed mock users. There is deliberately no secret or signature: this is
 * a role-switcher for demonstrations, not authentication.
 */
export class DemoAuthProvider implements AuthProvider {
  readonly name = "demo";

  async getCurrentUser(): Promise<AuthUser | null> {
    const store = await cookies();
    const id = store.get(DEMO_USER_COOKIE)?.value ?? DEFAULT_DEMO_USER_ID;
    return DEMO_USERS.find((u) => u.id === id) ?? DEMO_USERS[0];
  }

  async listSwitchableUsers(): Promise<AuthUser[]> {
    return DEMO_USERS;
  }
}
