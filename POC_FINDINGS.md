# PoC Findings

Companion to `README.md`. The README describes what the prototype is; this document records what evidence it produced and how that evidence bears on the Power Apps vs. Devin-assisted build-vs-buy decision. The measured third-workflow experiment is recorded in detail in [`THIRD_WORKFLOW_EXPERIMENT.md`](THIRD_WORKFLOW_EXPERIMENT.md).

**Comparison boundary.** This is not a controlled benchmark against Microsoft Power Apps. No equivalent Power Apps implementation of these workflows exists, and Power Apps time-to-build and engineering effort were not measured. The prototype provides empirical evidence for the custom-build side only.

**Framing.** The economic value of Devin in this case is engineering leverage: supporting a larger internal-tool portfolio with lower incremental effort per application. The decisive variable is marginal engineering effort per additional application.

| Label | Meaning |
|---|---|
| Case assumption | Given by the assignment |
| Observed | Directly supported by the repository, tests or session evidence |
| Documented capability | Microsoft capability from documentation |
| Illustrative assumption | Sensitivity input only; not a measurement or forecast |
| Not measured | Not established by this PoC |

## 1. Evaluation Question

Can Devin-assisted custom development reduce the incremental effort of building additional internal tools enough to make code ownership worth considering, compared with continuing to buy a managed platform such as Power Apps?

Case context: a Series C Korean fintech, about 60 engineers, roughly $250K/year on Power Apps for 3 internal tools, with at least 10 more planned.

## 2. What Was Tested

| Area | Status | Evidence |
|---|---|---|
| KYC Review | Implemented | Queue, filters, detail, masked ID, HIGH-risk approval tier, 14 synthetic cases |
| Refund Operations | Implemented | Queue, filters, detail, KRW 500,000 approval tier, 11 synthetic refunds |
| Payment Exception Review | Implemented | Queue with status/method/code filters, detail, KRW 1,000,000 approval tier, 10 synthetic exceptions; added as a timed experiment |
| Roles / RBAC | Implemented | `OPS_ANALYST`, `COMPLIANCE_APPROVER`, `ADMIN`; static permission matrix |
| Maker-checker | Partial | Tiered approval enforced; no same-user four-eyes constraint |
| Server-side authorization | Implemented | Shared engine `executeCaseAction()` reloads, authorizes, validates the transition, commits |
| Audit logging | Implemented | One `AuditEvent` per successful action in the same transaction as the state change |
| Shared workflow foundation | Implemented | Shared status model, transition rules, `CaseModule` contract used by all three modules |
| Shared UI / shell | Implemented | Shell, navigation, role switcher, tables, filters, detail layout, action panel, audit table |
| Persistence | Implemented | Prisma on SQLite with deterministic seed |
| Localization (EN/KR) | Implemented | Cookie-selected locale, 324 message keys, server and client components |
| Automated checks | Implemented | `npm run smoke` 16 checks; `npm run smoke:payments` 23 checks; lint and typecheck |
| Browser validation | Implemented | Recorded runs for the KYC/Refund demo flow and for the payment workflow; one defect found and fixed in each |
| Entra ID | Not implemented | Provider stub only; demo cookie identity |
| External financial integrations | Not implemented | Synthetic data only |
| CI/CD / production hosting | Not implemented | Local prototype |
| Security hardening | Not implemented | Unsigned identity cookie, plaintext data at rest, audit integrity by convention only |
| Regulatory compliance | Not measured | Requires production review |

## 3. Reuse Evidence

Counting method: non-blank lines in `*.ts`, `*.tsx` and `*.css` under `src/` at commit `691a29f`, counted with `grep -c '[^[:space:]]'` per file and summed. `prisma/` is reported separately. `src/lib/demo/seed.ts` is counted under Other. The five category rows sum to the total.

| Code area | Non-blank lines | Content |
|---|---:|---|
| Shared foundation | 1,915 | Auth abstraction, authorization, workflow engine, audit, i18n, shell, shared UI |
| KYC-specific | 164 | Policy, server action, queries, two pages |
| Refund-specific | 202 | Policy, threshold rule, server action, queries, two pages |
| Payment-specific | 221 | Policy, threshold rule, server action, queries, two pages |
| Other | 376 | Overview, layout, CSS, audit page, admin, seed data |
| Total `src/` | 2,878 | |
| `prisma/` (separate) | 94 | Schema and seed entry point |

- Shared foundation is about 67% of `src/`; the three modules together are about 20% (587 / 2,878), roughly 160–220 lines each.
- Each module implements only the `CaseModule` interface. Its server action calls the shared `handleCaseActionForm()` / `executeCaseAction()`, inside which `authorize()` and `recordAudit()` run; its pages use `DataTable`, `FilterBar`, `CaseDetail`, `ActionPanel` and `StatusBadge` unchanged.
- The whole value-tier rule in each module is one expression in `requiredPermission()`, e.g. `isHighValue(p) ? "payment:approve_high_value" : "payment:approve"`.

KYC and Refund landed in the same initial commit (`f2400b2`), so their reuse evidence is architectural — the shape of the code — not an observed build sequence. The third workflow was built afterwards and is the only sequential observation (section 4).

Line counts are not translated directly into engineering hours or cost savings.

## 4. Third-Workflow Experiment (Observed)

Payment Exception Review was added to the existing foundation under a single implementation prompt and timed by the user. Full record: `THIRD_WORKFLOW_EXPERIMENT.md`.

| Measure | Result |
|---|---|
| Wall-clock time (prompt submitted to validated working state, incl. testing and fixes) | 30 minutes, user-recorded |
| Files created | 6 (policy, action, queries, two pages, smoke script) |
| Files modified | 11, all at shared registration points (permissions, `EntityType`, nav, overview, audit filter and link map, dictionaries, seed, schema, `package.json`) |
| Shared engine / authz / audit / UI component code changed | None |
| Existing checks | `npm run smoke` 16/16 passing (no KYC/Refund regression) |
| New checks | `npm run smoke:payments` 23/23 passing |
| Lint / typecheck | passing |
| Browser verification | Recorded run: filters, analyst denial, escalation, standard and high-value approval, rejection, audit rows, Korean rendering, KYC/Refund regression |
| Defects during the experiment | 2, both caught by tests rather than review: a wrong audit action name in the new module (caught by the new smoke script; also exposed the same latent `REJECTD` bug in the two existing modules, left unchanged) and a missing audit-link registration (caught in the browser; fixed in `0401302`) |
| Commits | `ad8a82d` baseline → `ab94801` implementation → `0401302` fix → `cc763b7` record |

What this provides: one measured observation of marginal engineering effort for a review-style workflow similar to the two already present, on synthetic data, without integrations or production hardening. The work concentrated in domain policy, data and presentation, plus registering the entity in a known set of shared places.

What it does not provide: a general productivity rate. The workflow was deliberately small and shaped like the existing ones; a workflow with real integrations, a different interaction model, or new cross-cutting requirements would not be expected to take the same time. The second defect also shows the cost of a foundation with implicit registration points: a missed one surfaced only in browser testing.

Other session observations: the first working commit (two workflows) was pushed about an hour after the brief; the EN/KR localization commit changed a shared interface (`policyNote()` gained a translator parameter) and therefore touched both module files, showing that foundation-level interface changes scale with module count.

## 5. Cost and Effort Sensitivity

### Power Apps side (case assumptions)

About $250K/year for 3 applications, at least 10 more planned, potential portfolio of about 13. The case does not give Power Apps cost at 13 applications, marginal licensing per app, or the effort to build and maintain the existing apps. Implied linear reference: $250K / 3 ≈ $83K per current application — a reference point, not pricing.

| Scenario | Illustrative annual spend | Meaning |
|---|---:|---|
| Flat | ~$250K | Spend does not materially increase as apps are added |
| Moderate | ~$500K | Illustrative midpoint |
| Linear bound | ~$1.08M | $250K / 3 × 13 |

### Build side (illustrative assumptions)

| Scenario | Production foundation | Marginal hours / tool | Maintenance / operations |
|---|---:|---:|---|
| Optimistic | 300 h | 60 h | Low |
| Base | 500 h | 100 h | Moderate |
| Conservative | 1,000 h | 250 h | High |

Production foundation covers Entra ID, a managed database, CI/CD, secrets management and hardening. Hours exclude migrating the three existing Power Apps tools and any parallel-run period. At an illustrative $65/hour: ~1,080 h / ~$70K, ~1,800 h / ~$117K and ~4,250 h / ~$276K one-time, with ~$60K, ~$85K and ~$170K/year recurring.

The 30-minute observation in section 4 is a prototype-scale, synthetic-data number and is not an input to these production-scale rows; it informs only the direction of the "marginal hours" assumption for review-style workflows.

### Break-even framing

Low marginal effort favours custom ownership; bespoke workflows, integrations, hardening and operations raise it. If Power Apps spend stays near $250K as the portfolio grows, Buy is hard to outperform; if it grows materially, Build becomes plausible across a wider range of assumptions. No break-even point is stated as fact because production marginal effort and future Power Apps scaling are both unmeasured.

## 6. Power Apps vs. Build

| Dimension | Power Apps / Buy | Devin-Assisted Build | Evidence |
|---|---|---|---|
| Current cost | ~$250K/year for 3 tools | Not measured | Case assumption |
| Future portfolio cost | Sensitivity only | Sensitivity only | Illustrative |
| Development model | Managed low-code | Code-owned Next.js/TypeScript, Devin-assisted | Documented / observed |
| Reuse | Platform components, solutions, connectors | Shared custom foundation; third module added at registration points only | Documented / observed |
| Customization | Power Fx, custom connectors, PCF | Full source control | Documented / observed |
| Identity | Entra ID integrated | Demo cookie; Entra provider stub | Documented / not implemented |
| Authorization | Dataverse security roles | Server-side permission matrix | Documented / observed |
| Auditability | Dataverse auditing and activity logs | Transactional audit rows; integrity by convention | Documented / observed |
| Governance / lifecycle | Environments, DLP, solutions, pipelines | Must be built and operated | Documented / not implemented |
| Maintenance ownership | Microsoft platform + customer apps | Customer-owned stack | Structural difference |
| Marginal engineering effort | Not measured | One prototype-scale observation (30 min, review-style workflow) | Observed, single data point |
| Production readiness | Managed platform | Prototype only | Documented / not implemented |

The table records available evidence; it does not score or rank the options.

## 7. What Remains Unproven

| Area | Status |
|---|---|
| Production TCO | Not measured |
| Entra ID integration | Not implemented |
| Real financial-system integration | Not implemented |
| Migration effort from the existing Power Apps estate | Not measured |
| Security hardening | Not implemented |
| Regulatory compliance | Not validated |
| Long-term maintenance burden | Not measured |
| Marginal effort for non-review-style or integration-heavy tools | Not measured |
| Marginal effort at production scale | Not measured |
| Developer adoption and support burden | Not measured |

## 8. Decision Interpretation and Recommendation

- A reusable, code-owned internal-tool foundation with server-side authorization and transactional audit is technically viable at prototype scale.
- Each review-style module is roughly 160–220 lines of policy, queries and pages against the shared foundation, and the one sequential observation (30 minutes for the third) is consistent with low marginal effort for workflows that resemble the existing ones.
- The PoC does not establish lower production TCO than Power Apps, and one observed build does not show that future workflows will take the same time.

**Recommendation.** Keep the current Power Apps estate in place. Before any broader migration, run a controlled pilot with the next 2–3 real internal tools from the backlog in a production-like environment with Entra ID enabled, and measure: engineering hours per application (foundation vs. module-specific), production hardening effort, integration effort against real internal APIs, maintenance and support hours, defects and incidents, time to production, hosting and tooling cost, actual incremental Power Apps licensing cost where available, and equivalent metrics for comparable Power Apps workflows where possible.

The objective is to learn whether engineering effort grows sub-linearly as the portfolio expands and to replace the illustrative assumptions above with measured values. The build-vs-buy decision should rest on engineering leverage, portfolio scalability, operational burden and measured total cost — not on this prototype alone.
