# PoC Findings

Companion to `README.md`. The README describes what the prototype is; this document records what evidence it produced and how that evidence should be used in the Power Apps vs. Devin-assisted build-vs-buy evaluation.

This is not a controlled benchmark against Microsoft Power Apps. No Power Apps implementation of these workflows was available, so nothing here claims that the custom build was faster, cheaper, or better than Power Apps. Where cost figures appear, they are either taken from the case prompt or are explicitly labelled modelling assumptions used for sensitivity analysis.

Evidence labels used throughout:

| Label | Meaning |
|---|---|
| Case assumption | Supplied by the assignment brief |
| Observed | Directly supported by this repository, its test runs, or the Devin session history |
| Documented capability | Microsoft Power Apps / Power Platform capability per Microsoft documentation |
| Illustrative assumption | Modelling input used only for sensitivity analysis; not a measurement or forecast |
| Not measured | Cannot be established by this PoC |

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

## 5. Cost and Engineering Effort

### A. Case cost baseline

Case assumptions:

- Current Power Apps-related spend: approximately $250K/year.
- Current internal applications on Power Apps: 3.
- Planned additional applications: at least 10.
- Potential future portfolio: approximately 13 applications.

The assignment does not provide: Power Apps cost for a 13-application portfolio; marginal licensing cost per additional application; the Microsoft licensing terms in force; the engineering effort spent building the three existing applications; or the maintenance effort of the current estate. None of these values is known, and nothing below should be read as supplying them.

### B. Implied per-app reference

$250K / 3 = approximately $83K per current application.

This is the implied average under a simple linear allocation. It is not Power Apps pricing, not a per-app licence cost, and not a forecast. It exists only as a reference point for the sensitivity scenarios in C.

### C. Future Power Apps cost scenarios (13 applications)

| Scenario | Annual spend | Basis | Label |
|---|---:|---|---|
| Flat cost | ~$250K | Spend stays at today's level as apps are added (for example, per-user licensing already covers the user base) | Illustrative assumption |
| Moderate growth | ~$500K | Midpoint between flat and linear | Illustrative assumption; not a forecast |
| Linear scaling | ~$1.08M | $250K / 3 x 13, i.e. spend scales directly with application count | Illustrative sensitivity bound; not a prediction of Microsoft licensing cost |

Real Power Apps cost depends on per-user versus per-app licensing, premium connectors, Dataverse capacity, environments, support plans, enterprise agreement terms, and other Power Platform usage. The scenarios show how sensitive the decision is to future Power Apps economics; they do not estimate Microsoft pricing.

### D. Build-side engineering evidence

Observed in this repository and session (details in sections 2 to 4):

- Two workflows and three roles implemented on one codebase.
- Shared foundation of about 1,330 lines (28 files); KYC-specific code about 158 lines; Refund-specific code about 196 lines. Module-specific code is about 17% of `src/`; the shared foundation about 66%.
- The Refund module reused authorization, the workflow engine, audit, the shell, tables, filters, detail layout, notes, and the action/reason pattern without modification.
- 18 engine-level smoke checks pass; flows A to E were driven in a recorded browser run.
- One defect (audit reason column clipping) was found during that run and fixed in the same session.
- First working commit pushed about an hour after the brief was received (session timestamps; a single observation, not a rate).

Engineering interpretation: the evidence supports the claim that the second review-style workflow required substantially less new architectural work than the first. It does not quantify the labour saved. Line counts are not converted into hours or cost anywhere in this document.

### E. Illustrative build-side cost model

A production-ready custom-build path can be framed as:

```
Build cost = one-time production foundation
           + (marginal engineering cost per additional tool x number of tools)
           + annual maintenance and support
           + annual infrastructure, security, and operations
```

Every input below is an illustrative modelling assumption. None is an observed cost, and none is the customer's actual cost.

| Input | Value | Label |
|---|---:|---|
| Fully loaded engineering cost | $65/hour | Illustrative assumption |
| Production foundation effort (Entra ID, managed database, CI/CD, hardening of what the PoC sketches) | 500 hours | Illustrative assumption |
| Marginal effort per additional review-style tool | 100 hours | Illustrative assumption |
| Number of tools | 13 | Case assumption (3 existing + 10 planned) |
| Annual maintenance and support | $60K | Illustrative assumption |
| Annual infrastructure, security, and operations | $25K | Illustrative assumption |

Arithmetic under these assumptions: one-time cost = (500 + 13 x 100) hours x $65 = $117K; recurring cost = $85K/year; illustrative Year 1 total if all 13 tools were built in Year 1 = about $202K. The model excludes migration of the three existing Power Apps tools and their data, any parallel-running Power Apps spend during transition, and tools that do not fit the review-workflow pattern (see section 9). These are stated inputs to an example calculation, not a cost estimate for the customer.

### F. Build-side sensitivity

| Case | Foundation | Marginal per tool | Maintenance / yr | Infra, security, ops / yr | One-time (13 tools) | Recurring / yr | Illustrative Year 1 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Optimistic | 300 h | 60 h | $40K | $20K | $70K | $60K | ~$130K |
| Base | 500 h | 100 h | $60K | $25K | $117K | $85K | ~$202K |
| Conservative | 1,000 h | 250 h | $120K | $50K | $276K | $170K | ~$446K |

All values are illustrative assumptions at $65/hour. The cases are not weighted by probability. The spread (roughly 3.5x between optimistic and conservative Year 1) shows that build economics are dominated by marginal hours per tool, maintenance burden, production hardening, and integration complexity, none of which this PoC measured.

### G. Break-even framing

The key economic variable is marginal engineering effort per additional application.

- If new tools mainly reuse shared infrastructure and need limited module-specific work, custom ownership becomes more attractive.
- If each tool needs significant bespoke engineering, integration, security hardening, or operational support, the cost advantage can disappear.
- If Power Apps spend stays near $250K as the portfolio grows (flat scenario), the buy option is harder to beat: even the base build case's recurring cost is below it only if the one-time and migration costs are absorbed and marginal effort stays near 100 hours.
- If Power Apps spend grows materially with the portfolio (moderate or linear scenarios), the custom-build option becomes more economically plausible across a wider range of build assumptions.

Under the illustrative assumptions above, the base case's recurring cost ($85K/year) is below the flat Power Apps scenario ($250K/year) and the conservative Year 1 cost ($446K) is above it, while all three build cases are below the linear-scaling bound ($1.08M/year). This is arithmetic on labelled assumptions, not a break-even finding; the real break-even point cannot be derived until marginal effort and Power Apps scaling are measured.

## 6. Power Apps Comparison Boundary

This is not a performance benchmark because the two sides rest on different kinds of evidence:

- The case prompt supplies the assumed Power Apps spend (about $250K/year for three tools) and the application portfolio (at least 10 more). These are assumptions, not measurements.
- Microsoft's documentation supplies the managed-platform capability baseline (Entra ID sign-in, Dataverse security roles, environment and DLP governance, ALM via solutions and pipelines, managed hosting).
- The prototype supplies empirical evidence for the custom-build side only.
- No equivalent Power Apps implementation of KYC Review or Refund Operations exists for time-to-build, effort, or quality comparison.

| Dimension | Power Apps / Buy Baseline | Devin-Assisted Build Evidence | Evidence Type |
|---|---|---|---|
| Current annual cost | ~$250K/year for 3 tools | None (prototype has no run cost) | Case assumption / not applicable |
| Future portfolio cost (13 tools) | $250K to ~$1.08M/year depending on scenario | $130K to ~$446K illustrative Year 1 | Illustrative assumption (both sides) |
| Initial engineering effort | Effort to build the 3 existing apps not provided | PoC foundation built in one session; production foundation 300 to 1,000 h in model | Unknown (buy) / observed PoC, illustrative production (build) |
| Marginal effort per new tool | Not provided | Second module: ~196 lines of module code; hours not recorded; 60 to 250 h in model | Unknown (buy) / observed reuse, not measured hours (build) |
| Reuse | Components, solutions, shared connectors | Second module reused foundation; ~17% module-specific code | Documented capability / observed in PoC |
| Customization | Power Fx, custom connectors, PCF components | Arbitrary TypeScript; policies encoded in code and tested by script | Documented capability / observed in PoC |
| Identity | Entra ID built in | Cookie-based demo identity; Entra provider is a stub | Documented capability / not implemented |
| Authorization | Dataverse security roles, sharing | Static role/permission matrix enforced server-side | Documented capability / observed in PoC (enterprise scale not tested) |
| Auditability | Dataverse auditing, activity logs | Transactional `AuditEvent` rows and audit screen; append-only by convention | Documented capability / observed in PoC (integrity controls not implemented) |
| Governance | Environments, DLP policies, admin center | Source control only | Documented capability / not implemented |
| Lifecycle / deployment | Solutions, pipelines, managed environments | Local dev server; no CI/CD | Documented capability / not implemented |
| Maintenance ownership | Microsoft operates the platform; customer owns apps and licences | Customer owns code, dependencies, and upgrades | Case assumption / not measured |
| Infrastructure ownership | Managed by Microsoft | Customer-owned hosting, database, secrets, monitoring | Documented capability / not implemented |
| Production readiness | Managed service | Prototype only | Documented capability / not implemented |
| TCO confidence | Low: future licensing unknown | Low: marginal hours, maintenance, and hardening unmeasured | Unknown (both sides) |

The table records the kind of evidence available on each side. It does not score or rank the approaches.

## 7. Decision Interpretation

- The PoC demonstrates that reusable, code-owned internal tooling with server-side authorization and transactional audit is technically plausible on a conventional stack.
- The second workflow reused substantial shared infrastructure; this supports the hypothesis that marginal implementation effort may decrease across similar review-style workflows.
- The PoC does not establish lower production TCO than Power Apps, and it does not compare build time or quality with a Power Apps implementation, because none exists for these workflows.
- The financial outcome depends on three unmeasured variables: real marginal engineering effort per tool, ongoing maintenance and operations burden, and how Power Apps spend scales as the portfolio grows from 3 to about 13 applications.
- The appropriate conclusion at this stage is that the build option warrants a measured pilot, not that it should be adopted.

## 8. What Remains Unproven

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

## 9. Implication for 10+ Future Internal Tools

The case turns on marginal effort. If each additional tool requires most of the foundation to be rebuilt, code ownership is unlikely to compete with a managed platform. If each additional tool mostly adds a data model, a policy, and page declarations, the foundation's cost is amortized over the portfolio.

Based on the current code, a third review-style module (for example a limit-increase or account-closure workflow) would need to add:

- a Prisma model and seed data;
- a `CaseModule` implementation (the Refunds one is 42 lines) specifying which permission each action requires and any threshold logic;
- a one-line server action and one or two queries;
- a queue page declaring columns and a detail page declaring fields;
- permission strings and a navigation entry.

It would inherit identity, authorization enforcement, transitions, reason validation, transactional audit, notes, the audit screen, tables, filters, the detail layout, the action panel, and the shell.

A tool that does not fit the review pattern (different state machine, bulk operations, external API calls, reporting) would need new foundation work first, which is why the conservative case in section 5F uses a higher marginal effort. The engine's authorize-and-audit core would still apply, but the transition table and UI patterns would not. The prototype has not tested this case.

No cost saving is extrapolated from this. Two modules are evidence that the pattern works twice, not a measurement of the tenth.

## 10. Recommended Next Validation

A build-vs-buy verdict is not yet supported. The next step should be a small controlled pilot: build two or three real internal-tool candidates from the customer's backlog on this foundation, taking them to a production-like environment with Entra ID enabled, and record:

- actual engineering hours per tool, split between foundation work and module-specific work;
- production hardening effort (identity, database, secrets, CI/CD);
- integration effort against real internal APIs;
- security review effort and findings;
- defects and incidents;
- maintenance hours over the pilot period (upgrades, fixes, change requests);
- support burden (user issues, change requests);
- hosting and tooling cost;
- user adoption and satisfaction relative to the existing Power Apps tools;
- time from brief to production.

Where a comparable Power Apps workflow exists or is being built in parallel, collect the same metrics, together with the actual incremental Power Apps licensing cost. That creates the comparison group this PoC lacks and replaces the illustrative inputs in section 5 with measured values, which is what a production build-vs-buy decision requires.

## 11. Evidence Summary

Observed

- Two internal workflows with different data and approval policies run on one codebase, one authorization model, and one audit mechanism.
- The second module consists of a policy, a data model, queries, and page declarations; module-specific code is about 17% of `src/` by non-blank lines.
- Authorization is enforced server-side and audit rows are written transactionally; 18 engine-level checks and a recorded browser run confirm flows A to E.
- Devin completed implementation, verification, a bug fix, a UI pass, and documentation within a single constrained session.

Case assumptions

- About $250K/year of Power Apps spend across 3 internal tools; at least 10 more planned (about 13 in total).
- No data on Power Apps effort, marginal licensing cost, or maintenance burden was supplied.

Illustrative assumptions (sensitivity only)

- Power Apps at 13 apps: $250K flat, $500K moderate, $1.08M linear bound.
- Build side at $65/hour: 300 to 1,000 foundation hours, 60 to 250 marginal hours per tool, $60K to $170K recurring, giving $130K to $446K illustrative Year 1.

Not measured

- Any comparison of build time, effort, cost, or quality against Power Apps; no Power Apps implementation was available.
- Engineering hours for either module, production TCO, maintenance burden, migration effort, enterprise IAM, security posture, and regulatory compliance.
- Whether the reuse pattern holds for tools outside the review-workflow shape or for the tenth tool rather than the second.
