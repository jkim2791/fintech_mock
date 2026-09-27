import type { AuthProvider, AuthUser } from "./types";

/**
 * Placeholder for the production identity provider.
 *
 * Intended implementation (not built in this PoC):
 *  1. OIDC authorization-code flow against Microsoft Entra ID using
 *     AZURE_AD_CLIENT_ID / AZURE_AD_TENANT_ID / AZURE_AD_REDIRECT_URI
 *     (e.g. via Auth.js `microsoft-entra-id` provider or MSAL Node).
 *  2. Session stored in an httpOnly, signed cookie (or server-side session
 *     store), rotated on login.
 *  3. Role resolution: read the `groups` claim from the ID token, or call
 *     Microsoft Graph `GET /me/memberOf` when the groups-overage claim is
 *     present, then map group object IDs -> Role using
 *     AZURE_AD_GROUP_* environment variables.
 *  4. `getCurrentUser()` returns the same AuthUser shape the modules already
 *     consume, so KYC / Refund / Audit code is unchanged.
 */
export class EntraAuthProvider implements AuthProvider {
  readonly name = "entra";

  async getCurrentUser(): Promise<AuthUser | null> {
    throw new Error(
      "EntraAuthProvider is not implemented in this prototype. Set DEMO_MODE=true.",
    );
  }

  async listSwitchableUsers(): Promise<AuthUser[]> {
    return [];
  }
}
