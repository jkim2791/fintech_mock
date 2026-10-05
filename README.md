# Korean Fintech Internal Operations PoC

A time-boxed proof of concept: three internal review workflows — KYC Review, Refund Operations and Payment Exception Review — on one Next.js/TypeScript foundation with role-based authorization, a transactional audit trail and EN/KR localization. It was built to evaluate whether Devin-assisted custom development can support internal fintech workflows that might otherwise be implemented on a low-code platform such as Microsoft Power Apps.

This repository is not an attempt to recreate Power Apps as a product. All data is synthetic.

| Document | Content |
|---|---|
| `README.md` (this file) | What exists, how to run it, how it was verified |
| [`POC_FINDINGS.md`](POC_FINDINGS.md) | Build-vs-buy evidence and its limits |
| [`THIRD_WORKFLOW_EXPERIMENT.md`](THIRD_WORKFLOW_EXPERIMENT.md) | Measured record of adding the third workflow |

## Purpose

Can reusable, code-owned internal tooling reduce the marginal cost of adding applications while keeping acceptable control over authorization, workflow logic and auditability?

The first workflow established the shared foundation. The second tested architectural reuse. The third was added as a timed experiment to observe how much workflow-specific work a new module actually needs.

## Workflows

| | KYC Review | Refund Operations | Payment Exception Review |
|---|---|---|---|
| Routes | `/kyc`, `/kyc/[id]` | `/refunds`, `/refunds/[id]` | `/payments`, `/payments/[id]` |
| Queue filters | status, risk | status, risk | status, payment method, exception code |
| Detail fields | customer, masked RRN-style ID, country, submitted, review reason, reviewer | customer, masked transaction ref, amount, tier, requested, reason | masked payment ID, masked customer ID, amount, method, tier, exception code and reason, occurred time |
| Tier rule | HIGH-risk approve needs `kyc:approve_high_risk` | > KRW 500,000 needs `refund:approve_high_value` | > KRW 1,000,000 needs `payment:approve_high_value` |
| Synthetic rows | 14 | 11 | 10 |

All three share the same actions (add note, escalate, approve, reject — all but notes require a reason), the same status model (`PENDING_REVIEW -> ESCALATED -> APPROVED | REJECTED`), notes, per-case audit history and the queue/detail layout. Each module's own code is a `CaseModule` policy, one server action, two queries and two pages; see `THIRD_WORKFLOW_EXPERIMENT.md` for the exact file list of the third.

## Shared Capabilities

**Roles and authorization.** Three roles, each with a fixed demo user. Modules ask for permission strings (`src/lib/authz/permissions.ts`), never role names.

| Capability | OPS_ANALYST | COMPLIANCE_APPROVER | ADMIN |
|---|---|---|---|
| View all three queues | yes | yes | yes |
| Add notes, escalate, reject | yes | yes | yes |
| Approve standard tier (LOW/MEDIUM KYC, refunds <= 500k, exceptions <= 1M KRW) | yes | yes | yes |
| Approve HIGH-risk KYC, refunds > 500k, exceptions > 1M KRW | no | yes | yes |
| View audit log | no | yes | yes |
| Admin (permission matrix, reset demo data) | no | no | yes |

Authorization is enforced server-side, not only through UI visibility: every action runs through `executeCaseAction()` (`src/lib/workflow/engine.ts`), which reloads the entity, checks the permission the module's policy requires, validates the status transition, then commits the state change and the audit row in one transaction. Locked actions are still submittable so the server-side rejection can be observed.

**Audit log.** One `AuditEvent` per successful action, written in the same transaction as the state change, capturing timestamp, actor id/name/role, action name (e.g. `PAYMENT_EXCEPTION_APPROVED`), entity type and id, previous and new state and the reason. `/audit` lists the latest 200 events with module, action and actor filters; each row links to its case. Append-only by convention only: no database-level write protection, tamper evidence, retention or export.

**Localization.** EN / KR toggle in the header; the selection is a cookie applied to server- and client-rendered text (`src/lib/i18n/`, 324 message keys). Identifiers — role and permission names, status codes in audit rows, case IDs — stay in English. Noto Sans KR is bundled so Hangul renders without a Korean system font.

**Testing.** Two engine-level smoke scripts run the workflow rules without a browser and reset the dataset first: `npm run smoke` (20 checks, KYC and Refund) and `npm run smoke:payments` (23 checks, Payment Exception). Both end by asserting that every successful action produced exactly one audit row. Browser runs were recorded for the KYC/Refund demo flow and for the payment workflow.

## Architecture

```
app/                 /, /kyc, /kyc/[id], /refunds, /refunds/[id], /payments, /payments/[id], /audit, /admin
        |
components/shell     AppShell, permission-aware nav, breadcrumbs, demo role switcher, EN/KR toggle
components/shared    DataTable, FilterBar, DetailPage, CaseDetail, ActionPanel, AuditTable, badges
        |
modules/kyc          CaseModule policy + server action + queries
modules/refunds      CaseModule policy + server action + queries
modules/payments     CaseModule policy + server action + queries
        |
lib/workflow         executeCaseAction(): load -> authorize -> transition -> mutate + audit
lib/authz            permission strings, role matrix, authorize()/can()
lib/audit            recordAudit(), listAuditEvents()
lib/auth             AuthProvider interface, DemoAuthProvider (cookie), EntraAuthProvider (stub)
lib/i18n             EN/KR strings, cookie-selected locale, translator for server and client components
        |
lib/db + prisma/     Prisma client, SQLite schema (User, KycCase, RefundCase, PaymentException, CaseNote, AuditEvent), seed
```

Adding a module means a Prisma model, a `src/modules/<name>/` directory and two pages, plus registering the entity at fixed shared points: permission list and role matrix, `EntityType`, navigation, overview card, audit filter and link map, dictionaries, seed. Mutations are Next.js server actions; there is no separate API layer.

## Running Locally

Prerequisites: Node.js 22 and npm (verified with Node 22.12.0, npm 10.9.0). No external services or environment variables; `DEMO_MODE` defaults to `true` and `.env.example` documents the optional variables.

```bash
git clone https://github.com/jkim2791/fintech_mock.git
cd fintech_mock
npm install
npm run dev          # predev creates prisma/dev.db, pushes the schema, seeds; serves http://localhost:3000
```

Other commands:

```bash
npm run db:reset         # wipe and reseed prisma/dev.db
npm run smoke            # 20 KYC/Refund engine checks (resets data first)
npm run smoke:payments   # 23 Payment Exception engine checks (resets data first)
npm run lint
npm run typecheck
```

## Validation

Verified at `ce3cc5a` (Node 22.12.0):

| Check | Result |
|---|---|
| `npm install && npm run db:setup` | Seeded 3 users, 14 KYC cases, 11 refunds, 10 payment exceptions |
| `npm run smoke` | 20 PASS, 0 FAIL |
| `npm run smoke:payments` | 23 PASS, 0 FAIL |
| `npm run lint`, `npm run typecheck` | exit 0 |
| Routes (dev server) | `/`, `/kyc`, `/kyc/KYC-2025-0101`, `/refunds`, `/refunds/REF-2025-0201`, `/payments`, `/payments/PEX-2025-0301`, `/audit`, `/admin` all HTTP 200 |
| Analyst on `/audit`, `/admin` | Server-side "Access denied" naming the missing permission |

## Demo Flow

The role switcher (Analyst / Approver / Admin) sits top-right on every page; the default is the analyst. Start from `npm run db:reset` so the IDs below are in their seeded state.

1. As **Analyst**, open `/kyc/KYC-2025-0101` (HIGH risk). Add a note. *Approve* is locked; submitting a reason returns the server's rejection. Escalate with a reason.
2. Switch to **Approver** on the same case and approve. `KYC_CASE_APPROVED` appears in the case's audit history.
3. Open `/audit` and confirm the note, escalation and approval with actor, role, state change and reason.
4. As **Analyst**, open `/refunds/REF-2025-0201` (KRW 1,250,000): approval is rejected server-side. Approve `REF-2025-0202` (standard tier) to see it succeed.
5. Switch to **Approver** and approve `REF-2025-0201`.
6. As **Analyst**, open `/payments` and filter Method = Card. Open `PEX-2025-0301` (KRW 3,200,000): approval is rejected; escalate instead. Approve `PEX-2025-0302` (KRW 185,000) to see the standard tier succeed.
7. Switch to **Approver**, approve `PEX-2025-0301`, then reject `PEX-2025-0307` with a reason; `/audit` filtered to Payment exceptions shows both with links back to the cases.
8. Switch to **Admin** and open `/admin` for the role/permission matrix and the reset action.

## Data and Security Assumptions

- All customers, ID numbers, transactions, payments and users are synthetic (`src/lib/demo/seed.ts`). No real financial or identity data; no production credentials.
- Sensitive fields are masked in the UI but stored in plaintext in SQLite; no encryption at rest or field-level access logging.
- Demo identity is an unsigned cookie, so anyone with access to the app can switch roles. This is not a production security architecture.

## Microsoft Integration Path

Demo identities let the workflow, authorization and audit behaviour be evaluated without a tenant or SSO setup. Real Microsoft Entra ID integration is not implemented — a scope decision, not an omission. The intended path, documented in `src/lib/auth/entra-provider.ts`:

```
Microsoft Entra ID (OIDC sign-in)
  -> Microsoft Graph group membership
  -> application role mapping (group id -> OPS_ANALYST | COMPLIANCE_APPROVER | ADMIN)
  -> existing authorization layer (unchanged)
```

`EntraAuthProvider` would implement the same `AuthProvider` interface and return the same `AuthUser` shape, so module, workflow and audit code would not change. Today the stub throws when selected with `DEMO_MODE=false`, and the `AZURE_AD_*` placeholders in `.env.example` are not read.

## What This PoC Demonstrates

- Three review workflows on one codebase, the third added in a timed, documented experiment (`THIRD_WORKFLOW_EXPERIMENT.md`).
- Modules expressed as a policy, a server action, queries and pages against shared authorization, workflow, audit, UI and localization code.
- Custom business rules (risk- and value-tier approval, mandatory reasons, status transitions) in ordinary TypeScript.
- Server-side authorization and transactional audit logging, verifiable by the smoke scripts and recorded browser runs.
- Code ownership through a conventional stack with no runtime dependency on the tooling used to build it.

## What This PoC Does Not Demonstrate

Production readiness; regulatory compliance; lower total cost of ownership than Power Apps; enterprise-scale identity and access management; operational resilience or monitoring; integration with real financial systems; migration feasibility for an existing Power Apps estate; that the measured third-workflow time generalizes to other workflows.

## Production Considerations

In priority order: Microsoft Entra ID sign-in with group-based role mapping; a managed database with migrations and backups; secrets management; stronger authorization controls including a four-eyes rule; structured logging, monitoring and a build/deployment pipeline with tests beyond the smoke scripts; security and compliance review including audit-log integrity and retention; integration with real internal APIs.
