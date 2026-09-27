# PoC Findings

Companion to `README.md`. The README describes what the prototype is; this document records what evidence it produced and how that evidence should be used in the Power Apps vs. Devin-assisted build-vs-buy evaluation.

This is not a controlled benchmark against Microsoft Power Apps. No Power Apps implementation of these workflows was available, so nothing here claims that the custom build was faster, cheaper, or better than Power Apps.

## 1. Evaluation Question

Can Devin-assisted custom development reduce the incremental effort of building additional internal tools enough to make code ownership worth considering, compared with continuing to buy a managed platform such as Power Apps?

The case scenario: a Series C Korean fintech with about 60 engineers, roughly $250K/year on Power Apps for three internal tools, and at least 10 more tools planned. The prototype evaluates the build side of that question only. The buy side is represented by Microsoft's documented Power Platform capabilities and the commercial assumptions in the case prompt, not by anything measured here.

## 2. What Was Actually Tested

All items below exist in the repository and were exercised locally.

- Two workflows: KYC Review (14 synthetic cases) and Refund Operations (11 synthetic refunds).
- Three roles (`OPS_ANALYST`, `COMPLIANCE_APPROVER`, `ADMIN`) with a static permission matrix.
- Server-side authorization in a single workflow engine (`executeCaseAction()`); locked UI actions remain submittable so the server rejection is observable.
- Approval rules: HIGH-risk KYC and refunds above KRW 500,000 require the approver or admin role; escalate, approve, and reject require a reason.
- Audit logging: one `AuditEvent` row per successful action, written in the same transaction as the state change, with actor, role, action, entity, previous/new state, and reason. Audit screen with module, action, and actor filters.
- Shared workflow infrastructure: one status model and transition table, one `CaseModule` contract, one form-to-engine adapter.
- Shared application shell and UI components across both modules.
- Persistence: Prisma on SQLite, seeded deterministically.
- Demo flows A to E from the case prompt: driven in a browser (recorded), and flows A to D re-run against the engine by `npm run smoke` (18 checks, including "every successful action produced exactly one audit row").

Not tested: load, concurrency, long-running operation, any non-demo identity provider, any external integration.

## 3. Reuse Evidence

Counting method: non-blank lines in `*.ts`, `*.tsx`, `*.css`, and `*.prisma` files under `src/` and `prisma/` at commit `52de7e7`, counted with `rg -c '\S'`. Comments are included. Generated files, configuration, and `node_modules` are excluded. Total: 2,026 lines in `src/`.

| Layer | Files | Lines | Used by |
|---|---:|---:|---|
| `lib/auth` (provider interface, demo users, Entra stub, switch action) | 6 | 140 | both modules, every page |
| `lib/authz` (permissions, matrix, `authorize()`/`can()`) | 2 | 72 | both modules, audit, admin |
| `lib/audit` (`recordAudit()`, queries) | 1 | 53 | both modules, seed, admin |
| `lib/workflow` (types, transitions, engine, form adapter) | 4 | 179 | both modules |
| `lib/db`, `lib/format` | 2 | 33 | everything |
| `components/shell` (shell, nav, breadcrumbs, role switcher) | 4 | 205 | every page |
| `components/shared` (table, filters, detail, action panel, audit table, badges, icons) | 9 | 648 | both modules, audit, overview |
| **Shared foundation** | **28** | **1,330** | |
| `modules/kyc` + `app/kyc/**` (policy, action, queries, 2 pages) | 5 | 158 | KYC only |
| `modules/refunds` + `app/refunds/**` (policy, action, queries, 2 pages) | 5 | 196 | Refunds only |
| Other (`app/` root and overview, audit page, admin, seed data, schema) | 11 | 422 | |

Each module additionally owns one Prisma model (about 15 lines each), its seed rows, six permission strings in `permissions.ts`, and one navigation entry in `AppShell`.

What the second module (Refunds) added versus what it inherited:

- Added: `RefundCase` model and seed rows; `refundModule` policy (42 lines, including the KRW threshold and demo FX conversion); a one-line server action; two queries; a queue page declaring columns; a detail page declaring fields; six permission strings; one nav entry.
- Inherited without modification: identity resolution, `authorize()`, the workflow engine and transition rules, reason validation, transactional audit writes, the audit table and per-case history, notes, the data table and URL-backed filters, the detail layout and action panel, status/risk badges, the shell, and the role switcher.

The two modules' own code is about 17% of `src/` (354 of 2,026 lines); the shared foundation is about 66%. Line counts describe code volume, not effort. They are not converted into engineering hours here, and the shared foundation was itself written for this PoC, so its cost is part of the first module's cost, not free.

## 4. What the Prototype Suggests

- Common internal-tool capabilities (identity, authorization, audit, workflow transitions, tables, detail pages, reason capture) can be centralized and reused across workflows with different data and policies.
- The second workflow did not require rebuilding the stack. It was expressed as a policy, a data model, queries, and page declarations against the existing foundation.
- Custom business rules (risk-tier and value-tier approval, mandatory reasons, maker-checker split) were implemented directly in TypeScript and are unit-checkable outside the UI (`scripts/smoke.ts`).
- Server-side enforcement and transactional audit logging are achievable in a small codebase without a platform providing them.
- Devin performed implementation, browser-driven verification, bug fixing (one table-clipping defect found during the recorded run and fixed in `5975faa`), a UI redesign pass, and documentation within a constrained PoC. The first working commit was pushed within about an hour of receiving the brief (session timestamps); this is an observation about one run, not a measured development rate.

Together these support the hypothesis that marginal implementation effort for additional review-style workflows can be lower than the first. They do not show by how much, nor how the result compares with building the same tools in Power Apps.

## 5. Power Apps Comparison Boundary

This is not a performance benchmark because the two sides rest on different kinds of evidence:

- The case prompt supplies the assumed Power Apps spend (about $250K/year for three tools) and the application portfolio (at least 10 more). These are assumptions, not measurements.
- Microsoft's documentation supplies the managed-platform capability baseline (Entra ID sign-in, Dataverse security roles, environment and DLP governance, ALM via solutions and pipelines, managed hosting).
- The prototype supplies empirical evidence for the custom-build side only.
- No equivalent Power Apps implementation of KYC Review or Refund Operations exists for time-to-build, effort, or quality comparison.

| Dimension | Power Apps / Buy Baseline | Devin-Assisted Build Evidence | Status |
|---|---|---|---|
| Application development | Low-code canvas/model-driven apps, connectors (documented capability) | Two workflows built on a shared Next.js/Prisma foundation | Observed in PoC; not compared |
| Customization | Power Fx, custom connectors, PCF components (documented capability) | Arbitrary TypeScript; policies encoded in code and tested by script | Observed in PoC |
| Identity | Entra ID built in (documented capability) | Cookie-based demo identity; Entra provider is a stub | Not implemented |
| Authorization | Dataverse security roles, sharing (documented capability) | Static role/permission matrix enforced server-side | Observed in PoC; enterprise scale not tested |
| Auditability | Dataverse auditing, activity logs (documented capability) | Transactional `AuditEvent` rows and audit screen; append-only by convention | Observed in PoC; integrity controls not implemented |
| Governance | Environments, DLP policies, admin center (documented capability) | None beyond source control | Not implemented |
| Lifecycle / deployment | Solutions, pipelines, managed environments (documented capability) | Local dev server only; no CI/CD | Not implemented |
| Maintenance ownership | Microsoft operates the platform; customer owns apps and licences | Customer owns code, runtime, data, and pipeline | Case assumption; burden not measured |
| Reuse across future apps | Components, solutions, shared connectors (documented capability) | Second module reused foundation; about 17% module-specific code | Observed in PoC; third module not built |
| Cost | About $250K/year for three tools | Not measured | Case assumption / not measured |
| Production readiness | Managed service | Prototype only | Not implemented |

The table records the kind of evidence available on each side. It does not score or rank the approaches.

## 6. What Remains Unproven

- Production total cost of ownership of a code-owned stack, including hosting, tooling, and on-call.
- Actual maintenance burden over time (dependency upgrades, framework changes, security patches).
- Enterprise Entra ID integration, group-to-role mapping at scale, and session management.
- Integration with real financial systems (KYC vendors, payment ledgers, core banking).
- Effort to migrate the existing three Power Apps tools and their data.
- Operational resilience: backups, failover, incident response.
- Security hardening: encryption at rest, audit log integrity, secrets management, penetration testing.
- Regulatory compliance for Korean financial and personal-data requirements.
- Developer adoption: whether the team will maintain and extend this foundation.
- Support burden: who handles user issues and change requests once the tools are in production.

## 7. Implication for 10+ Future Internal Tools

The case turns on marginal effort. If each additional tool requires most of the foundation to be rebuilt, code ownership is unlikely to compete with a managed platform. If each additional tool mostly adds a data model, a policy, and page declarations, the foundation's cost is amortized over the portfolio.

Based on the current code, a third review-style module (for example a limit-increase or account-closure workflow) would need to add:

- a Prisma model and seed data;
- a `CaseModule` implementation (the Refunds one is 42 lines) specifying which permission each action requires and any threshold logic;
- a one-line server action and one or two queries;
- a queue page declaring columns and a detail page declaring fields;
- permission strings and a navigation entry.

It would inherit identity, authorization enforcement, transitions, reason validation, transactional audit, notes, the audit screen, tables, filters, the detail layout, the action panel, and the shell.

A tool that does not fit the review pattern (different state machine, bulk operations, external API calls, reporting) would need new foundation work first. The engine's authorize-and-audit core would still apply, but the transition table and UI patterns would not. The prototype has not tested this case.

No cost saving is extrapolated from this. Two modules are evidence that the pattern works twice, not a measurement of the tenth.

## 8. Recommended Next Validation

A build-vs-buy verdict is not yet supported. The next step should be a small controlled pilot: build two or three real internal-tool candidates from the customer's backlog on this foundation, taking them to a production-like environment with Entra ID enabled, and record:

- engineering hours per tool, split between foundation work and module work;
- time from brief to production;
- maintenance effort over the pilot period (upgrades, fixes, change requests);
- defects and incidents;
- integration effort against real internal APIs;
- security review effort and findings;
- user adoption and satisfaction relative to the existing Power Apps tools;
- operating cost (hosting, tooling, on-call).

Where a comparable Power Apps tool exists or is being built in parallel, record the same measures for it. That would supply the effort, cost, and quality data this PoC cannot, and would make a production build-vs-buy decision defensible.

## 9. Evidence Summary

Observed

- Two internal workflows with different data and approval policies run on one codebase, one authorization model, and one audit mechanism.
- The second module consists of a policy, a data model, queries, and page declarations; module-specific code is about 17% of `src/` by non-blank lines.
- Authorization is enforced server-side and audit rows are written transactionally; 18 engine-level checks and a recorded browser run confirm flows A to E.
- Devin completed implementation, verification, a bug fix, a UI pass, and documentation within a single constrained session.

Not measured

- Any comparison of build time, effort, cost, or quality against Power Apps; no Power Apps implementation was available.
- Production TCO, maintenance burden, migration effort, enterprise IAM, security posture, and regulatory compliance.
- Whether the reuse pattern holds for tools outside the review-workflow shape or for the tenth tool rather than the second.
