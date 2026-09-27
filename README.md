# Ops Portal — internal-tools foundation PoC

A small Next.js + TypeScript + SQLite prototype built to test one question for a hypothetical Series C Korean fintech:

> Can a reusable, code-owned foundation make the **second, third and tenth** internal application materially cheaper to build than continuing on Microsoft Power Apps — while leaving an acceptable ownership burden?

It is **not** an attempt to recreate Power Apps as a product. It contains two internal tools — **KYC Review** and **Refund Operations** — where the second was built almost entirely from the shared foundation created for the first. All data is synthetic.

## What this prototype demonstrates

| Concern | Where it lives | Reused by |
|---|---|---|
| App shell, permission-aware navigation, DEMO_MODE role switcher | `src/components/shell/` | every screen |
| Identity abstraction (`AuthProvider` → demo / Entra placeholder) | `src/lib/auth/` | every screen and server action |
| Role → permission matrix, server-side `authorize()` | `src/lib/authz/` | KYC, Refunds, Audit, Admin |
| Generic review workflow engine: load → authorize → validate transition → mutate + audit in one transaction | `src/lib/workflow/engine.ts` | KYC, Refunds |
| Append-only audit log + audit screen | `src/lib/audit/`, `src/app/audit/` | all privileged actions |
| Data table, URL-backed filters, detail layout, status/risk badges, confirm-with-reason action panel, notes, per-case audit history | `src/components/shared/` | KYC, Refunds |

A module is then thin. `src/modules/refunds/` is ~150 lines: a `CaseModule` definition (entity loader, **policy** deciding which permission each action needs, status writer, audit action names), one server action that delegates to the shared handler, two queries, and two pages that declare columns/fields. No second architecture.

### Enforcement, not hiding

Authorization runs in the workflow engine (server action), not in the UI. To make that visible in a demo, actions the current role is not expected to hold are rendered **locked** but still clickable — submitting one returns the server's rejection message inline (`OPS_ANALYST is not permitted to perform 'kyc:approve_high_risk'…`). `npm run smoke` proves the same rules with no browser involved.

## How to run

```bash
npm install
npm run dev        # creates prisma/dev.db, seeds synthetic data (idempotent), starts http://localhost:3000
```

Other commands:

```bash
npm run db:reset   # wipe and reseed the SQLite database
npm run smoke      # run demo flows A–D against the workflow engine (resets data first)
npm run lint && npm run typecheck
```

No environment variables are required. Copy `.env.example` to `.env` only if you want to change defaults.

## Demo users / roles

Use the **Demo · act as** switcher (Analyst / Approver / Admin) in the top-right of every page. It sets a plain cookie; there is no real authentication in this mode.

| User | Role | Can | Cannot |
|---|---|---|---|
| Park Ji-woo | `OPS_ANALYST` | view KYC & refunds, add notes, escalate, approve/reject **standard-tier** cases | approve HIGH-risk KYC, approve refunds > KRW 500,000, view audit log, admin |
| Kim Min-seo | `COMPLIANCE_APPROVER` | everything above **plus** HIGH-risk KYC approval, high-value refund approval, audit log | admin |
| Lee Do-yun | `ADMIN` | everything, Administration page (reset demo data, view permission matrix) | — |

The full role → permission matrix is rendered at `/admin` and derives from `src/lib/authz/permissions.ts`.

### Suggested demo script

- **Flow A** — as `OPS_ANALYST`, open `KYC-2025-0101` (HIGH risk): add a note, escalate; try *Approve* → server rejects.
- **Flow B** — switch to `COMPLIANCE_APPROVER`, same case: approve with a rationale → status flips, the `KYC_CASE_APPROVED` event appears in *Audit history* on the case and in `/audit`.
- **Flow C** — as `OPS_ANALYST`, open `REF-2025-0201` (KRW 1,250,000): *Approve* is locked; submitting is rejected.
- **Flow D** — as `COMPLIANCE_APPROVER`, approve it → `REFUND_APPROVED` persisted with previous/new state and reason.
- **Flow E** — move between KYC and Refunds: same shell, same badges, same action panel, same audit table; only fields and policy differ.

## Architecture

```
src/
  lib/
    auth/        AuthProvider interface, DemoAuthProvider (cookie), EntraAuthProvider (documented stub)
    authz/       Permission strings, ROLE_PERMISSIONS, authorize()/can()
    audit/       recordAudit() (transaction-aware), listAuditEvents()
    workflow/    ReviewStatus/CaseAction types, TRANSITIONS, CaseModule<T> contract, executeCaseAction()
    demo/        synthetic seed dataset (also used by the Admin "reset" action)
  components/
    shell/       AppShell, SidebarNav, Breadcrumbs, RoleSwitcher
    shared/      DataTable, FilterBar, DetailPage, CaseDetail, ActionPanel, AuditTable, badges
  modules/
    kyc/         CaseModule definition + policy (HIGH risk → kyc:approve_high_risk), server action, queries
    refunds/     CaseModule definition + policy (> KRW 500k → refund:approve_high_value), server action, queries
  app/           thin route files: /, /kyc, /kyc/[id], /refunds, /refunds/[id], /audit, /admin
prisma/          schema (SQLite) + seed entrypoint
scripts/smoke.ts engine-level verification of the demo flows
```

**Adding an eleventh tool** means: a Prisma model, a `CaseModule` (≈40 lines, mostly the policy), a one-line server action, a queue page declaring columns, a detail page declaring fields, a nav entry, and new permission strings. Auth, authorization, audit, transitions, reason capture, tables and layout come for free.

The status model (`PENDING_REVIEW → ESCALATED → APPROVED | REJECTED`) is shared. A tool needing a different state machine would supply its own transitions; the engine's authorize-and-audit core still applies.

## Microsoft production path

`DEMO_MODE=false` selects `EntraAuthProvider` (`src/lib/auth/entra-provider.ts`), currently a documented stub. The intended implementation:

1. OIDC authorization-code flow against Microsoft Entra ID using `AZURE_AD_CLIENT_ID`, `AZURE_AD_TENANT_ID`, `AZURE_AD_REDIRECT_URI` (e.g. Auth.js `microsoft-entra-id` provider or MSAL Node), with a signed httpOnly session cookie.
2. Role resolution from the token's `groups` claim, falling back to Microsoft Graph `GET /me/memberOf` when the groups-overage claim is present; map group object IDs → `Role` via `AZURE_AD_GROUP_*` variables.
3. `getCurrentUser()` returns the same `AuthUser` shape, so nothing in `modules/`, `workflow/`, `audit/` or the pages changes. The `RoleSwitcher` simply disappears because `listSwitchableUsers()` returns `[]`.

## Limitations (what is mocked)

- **Authentication** is a cookie naming a mock user. Anyone can switch roles. Do not deploy as-is.
- **SQLite** file database; production would use a managed Postgres/MySQL with migrations (`prisma migrate`), backups and least-privilege DB roles.
- **Sensitive fields** (synthetic RRN-style IDs) are stored in plaintext and masked only at render time. Production needs encryption at rest / tokenisation and field-level access logging.
- **Audit log** is append-only by convention (no DB-level protection, no tamper evidence, no retention policy, no export).
- **Workflow** has a single fixed status model, no assignment/queueing, no SLA, no four-eyes on the *same* user (a `COMPLIANCE_APPROVER` may approve a case they escalated).
- **Currency conversion** for the KRW threshold uses hard-coded demo rates.
- No pagination, search, tests beyond `scripts/smoke.ts`, CI, Docker, monitoring, or i18n.
- Devin was used to accelerate development only; it is **not** a runtime dependency. The company owns the code, runtime, data and deployment.

## Tradeoffs made for the two-hour scope

- Server actions instead of a REST/tRPC API layer — fewer files, same server-side enforcement. An API layer can wrap the same `executeCaseAction()`.
- Notes reuse the action/reason panel and are audited like any other action rather than having a dedicated UI.
- Prisma string columns instead of enums (SQLite), constrained by TypeScript unions.
