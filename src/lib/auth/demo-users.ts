import type { AuthUser } from "./types";

/** Deterministic mock identities. Also seeded into the User table. */
export const DEMO_USERS: AuthUser[] = [
  {
    id: "u-analyst",
    name: "Park Ji-woo",
    email: "jiwoo.park@example-fintech.test",
    role: "OPS_ANALYST",
    title: "Operations Analyst",
  },
  {
    id: "u-approver",
    name: "Kim Min-seo",
    email: "minseo.kim@example-fintech.test",
    role: "COMPLIANCE_APPROVER",
    title: "Compliance Approver",
  },
  {
    id: "u-admin",
    name: "Lee Do-yun",
    email: "doyun.lee@example-fintech.test",
    role: "ADMIN",
    title: "Platform Administrator",
  },
];

export const DEFAULT_DEMO_USER_ID = "u-analyst";
