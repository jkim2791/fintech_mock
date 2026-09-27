# Korean Fintech Internal Operations PoC

A time-boxed proof of concept: two internal review workflows (KYC Review and Refund Operations) built on a shared Next.js/TypeScript foundation with role-based authorization and an audit trail. It was built to evaluate whether Devin-assisted custom development can support internal fintech workflows that might otherwise be implemented on a low-code platform such as Microsoft Power Apps.

This repository is not an attempt to recreate Power Apps as a product. All data is synthetic.

## Purpose

The evaluation question is narrow: can reusable, code-owned internal tooling reduce the marginal cost of building additional applications while keeping acceptable control over authorization, workflow logic, and auditability?

The prototype deliberately contains two workflows rather than one polished application. The first module establishes the shared foundation; the second exists to test how much of it is actually reused.

## What Was Built

### KYC Review

- Case queue at `/kyc` with status and risk filters (URL query parameters).
- Case detail at `/kyc/[id]` with the synthetic RRN-style ID number masked at render time (`930412-2******`), notes, and, for roles holding `audit:view`, the case's audit history.
- Actions: add note, escalate, approve, reject. All but notes require a reason.
- Approving a HIGH-risk case requires `kyc:approve_high_risk`, which `OPS_ANALYST` does not hold.

### Refund Operations

- Refund queue at `/refunds` with the same filters; detail at `/refunds/[id]` with amount, approval tier, and a masked transaction reference. Same actions and reason requirement as KYC.
- Refunds above KRW 500,000 require `refund:approve_high_value`. Non-KRW amounts are converted with fixed demo rates for the threshold check only.
- The module adds a `CaseModule` policy, one server action, and two queries; everything else is the shared implementation used by KYC.

### Localization

- EN / KR toggle in the header; the selection is stored in a cookie and applied to server- and client-rendered UI text (`src/lib/i18n/`, 268 message keys). Identifiers such as role names, permission strings, status codes in audit rows, and case IDs stay in English.

### Audit Log

Every successful note
, escalate, approve, and reject writes one `AuditEvent` row in the same transaction as the state change; seeding and the admin reset are also recorded. Each event captures timestamp, actor id/name/role, action name (for example `KYC_CASE_APPROVED`), entity type and id, previous and new state, and the reason entered.

`/audit` lists the most recent 200 events with module, action, and actor filters; detail pages show the events for that case. The log is append-only by convention only: no database-level write protection, tamper evidence, retention, or export.

## Roles and Authorization

Three roles are implemented, each with a fixed demo user.

| Capability | OPS_ANALYST | COMPLIANCE_APPROVER | ADMIN |
|---|---|---|---|
| View KYC cases and refunds | yes | yes | yes |
| Add notes, escalate, reject | yes | yes | yes |
| Approve LOW/MEDIUM-risk KYC, refunds <= KRW 500,000 | yes | yes | yes |
| Approve HIGH-risk KYC | no | yes | yes |
| Approve refunds > KRW 500,000 | no | yes | yes |
| View audit log | no | yes | yes |
| Administration (permission matrix, reset demo data) | no | no | yes |

Roles map to permission strings in `src/lib/authz/permissions.ts`; module code asks for a permission, never a role name.

Authorization is enforced in application logic, not only through UI visibility. Every action goes through `executeCaseAction()` (`src/lib/workflow/engine.ts`), which reloads the entity, calls `authorize()` for the permission the module's policy requires, validates the status transition, and commits the state change and audit row together. Actions the current role does not hold are rendered locked but still submittable, so the server-side rejection can be observed. `npm run smoke` exercises the same rules without a browser.

## Architecture

```
app/ (routes)          /, /kyc, /kyc/[id], /refunds, /refunds/[id], /audit, /admin
        |
components/shell       AppShell, permission-aware nav, breadcrumbs, demo role switcher, EN/KR toggle
components/shared      DataTable, FilterBar, DetailPage, CaseDetail, ActionPanel, AuditTable, badges
        |
modules/kyc            CaseModule policy + server action + queries
modules/refunds        CaseModule policy + server action + queries
        |
lib/workflow           executeCaseAction(): load -> authorize -> transition -> mutate + audit
lib/authz              permission strings, role matrix, authorize()/can()
lib/audit              recordAudit(), listAuditEvents()
lib/auth               AuthProvider interface, DemoAuthProvider (cookie), EntraAuthProvider (stub)
lib/i18n               EN/KR UI strings, cookie-selected locale, translator for server and client components
        |
lib/db + prisma/       Prisma client, SQLite schema (User, KycCase, RefundCase, CaseNote, AuditEvent), seed
```

Shared between KYC and Refunds: the shell and navigation, identity resolution, the permission matrix and `authorize()`, the workflow engine and status model (`PENDING_REVIEW -> ESCALATED -> APPROVED | REJECTED`), audit recording and display, the `CaseNote` table, and every UI component. Module-specific: the Prisma model, the `CaseModule` policy deciding which permission each action needs, queue columns, and detail fields.

Mutations are Next.js server actions; there is no separate API layer.

## Running Locally

Prerequisites: Node.js 22 and npm (verified with Node 22.12.0, npm 10.9.0). No external services.

```bash
git clone https://github.com/jkim2791/fintech_mock.git
cd fintech_mock
npm install
npm run dev
```

`npm run dev` runs a `predev` step that creates `prisma/dev.db`, pushes the schema, and seeds the synthetic dataset (skipped if already seeded), then starts the dev server at http://localhost:3000.

No environment variables are required. `DEMO_MODE` defaults to `true`; `.env.example` documents the optional variables.

Other commands:

```bash
npm run db:reset    # wipe and reseed prisma/dev.db
npm run smoke       # 16 engine-level checks covering Demo Flow steps 1, 2, 4, 5 (resets data first)

npm run lint
npm run typecheck
```

## Demo Flow

The demo user switcher (Analyst / Approver / Admin) is in the top-right of every page. It sets a plain cookie naming one of three fixed users; the default is the analyst. Start from a fresh dataset (`npm run db:reset`) so the case IDs below are in their seeded state.

1. As **Analyst**, open `/kyc/KYC-2025-0101` (HIGH risk, pending). Add a note. Click *Approve*: the button is marked locked; submitting a reason returns the server's rejection. Escalate the case with a reason.
2. Switch to **Approver** on the same case. Approve with a reason. The status becomes Approved and `KYC_CASE_APPROVED` appears in the case's audit history.
3. Open `/audit` and confirm the note, escalation, and approval are listed with actor, role, state change, and reason.
4. As **Analyst**, open `/refunds/REF-2025-0201` (KRW 1,250,000). *Approve* is locked; submitting is rejected. Approve a refund at or below KRW 500,000 (for example `REF-2025-0202`) to see the standard tier succeed.
5. Switch to **Approver** and approve `REF-2025-0201`. `REFUND_APPROVED` is recorded with previous state, new state, and reason.
6. Switch to **Admin** and open `/admin` to see the role/permission matrix and the reset action.

## Data and Security Assumptions

- All customers, ID numbers, transactions, and users are synthetic (`src/lib/demo/seed.ts`). No real financial or identity data is included and no production credentials are required.
- ID numbers and transaction references are masked in the UI but stored in plaintext in SQLite; there is no encryption at rest or field-level access logging.
- Demo identity is an unsigned cookie, so anyone with access to the app can switch roles. This is not a production security architecture.

## Microsoft Integration Path

The prototype uses demo identities so the workflow, authorization, and audit behaviour could be evaluated without a tenant, app registration, or SSO setup. Real Microsoft Entra ID integration is not implemented; this was a scope decision, not an omission.

The intended production path, documented in `src/lib/auth/entra-provider.ts`:

```
Microsoft Entra ID (OIDC sign-in)
  -> Microsoft Graph group membership (groups claim, or /me/memberOf on overage)
  -> application role mapping (group object id -> OPS_ANALYST | COMPLIANCE_APPROVER | ADMIN)
  -> existing authorization layer (unchanged)
```

`EntraAuthProvider` would implement the same `AuthProvider` interface and return the same `AuthUser` shape, so modules, workflow, and audit code would not change. Today the stub is selected with `DEMO_MODE=false` but throws, and the `AZURE_AD_*` placeholders in `.env.example` are not read by any code.

## What This PoC Demonstrates

- Two internal review workflows implemented on one codebase within a short, fixed time budget.
- A second module built from a policy, a server action, queries, and page declarations, reusing authorization, workflow, audit, and UI from the first.
- Custom business rules (risk- and value-tier approval, mandatory reasons, status transitions) encoded in ordinary TypeScript.
- Server-side authorization and transactional audit logging, verifiable through `npm run smoke`.
- Code ownership through a conventional stack (Next.js, TypeScript, Prisma) with no runtime dependency on the tooling used to build it.

## What This PoC Does Not Demonstrate

- Production readiness.
- Regulatory compliance.
- Lower total cost of ownership than Power Apps.
- Enterprise-scale identity and access management.
- Operational resilience, monitoring, or incident handling.
- Integration with real financial or core banking systems.
- Migration feasibility for an existing Power Apps estate.

## Production Considerations

In priority order:

1. Microsoft Entra ID sign-in and group-based role mapping.
2. Managed database with migrations and backups in place of the local SQLite file.
3. Secrets management.
4. Stronger authorization controls, including a four-eyes rule so the same user cannot escalate and approve a case.
5. Structured logging, monitoring, and a build/deployment pipeline with tests beyond the smoke script.
6. Security and compliance review, including audit log integrity and retention.
7. Integration with real internal APIs and data sources.
