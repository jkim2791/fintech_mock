import { DemoAuthProvider } from "./demo-provider";
import { EntraAuthProvider } from "./entra-provider";
import type { AuthProvider, AuthUser } from "./types";

export type { AuthProvider, AuthUser, Role } from "./types";

export function isDemoMode(): boolean {
  // Default to demo mode so `npm install && npm run dev` works with no config.
  return (process.env.DEMO_MODE ?? "true").toLowerCase() !== "false";
}

let provider: AuthProvider | undefined;

export function getAuthProvider(): AuthProvider {
  if (!provider) {
    provider = isDemoMode() ? new DemoAuthProvider() : new EntraAuthProvider();
  }
  return provider;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return getAuthProvider().getCurrentUser();
}

export class UnauthenticatedError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "UnauthenticatedError";
  }
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}
