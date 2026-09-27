# PoC Findings

Companion to `README.md`. The README describes what the prototype is; this document records what evidence it produced and how that evidence bears on the Power Apps vs. Devin-assisted build-vs-buy decision.

**Comparison boundary.** This is not a controlled benchmark against Microsoft Power Apps. No equivalent Power Apps implementation of the KYC or Refund workflows exists, and Power Apps time-to-build and engineering effort were not measured. The prototype provides empirical evidence for the custom-build side only.

**Framing.** The economic value of Devin is not necessarily fewer engineers. It is the ability for the same engineering organization to support more internal tools with less incremental effort. Nothing here assumes headcount reduction.

| Label | Meaning |
|---|---|
| Case assumption | Given by the assignment |
| Observed | Directly supported by the repository or test/session evidence |
| Documented capability | Microsoft capability from documentation |
| Illustrative assumption | Sensitivity input only; not a measurement or forecast |
| Not measured | Not established by this PoC |

## 1. Evaluation Question

Can Devin-assisted custom development reduce the incremental effort of building additional internal tools enough to make code ownership worth considering, compared with continuing to buy a managed platform such as Power Apps?

Case context: a Series C Korean fintech, about 60 engineers, roughly $250K/year on Power Apps for 3 internal tools, at least 10 more planned (about 13 in total). The relevant question is not how many engineers can be removed, but how much incremental engineering capacity each additional internal tool consumes.

## 2. What Was Tested

| Area | Status | Evidence |
|---|---|---|
| KYC Review workflow | Implemented | Queue, filters, detail, masked ID, 14 synthetic cases |
| Refund workflow | Implemented | Queue, filters, detail, KRW 500,000 rule, 11 synthetic refunds |
| Roles / RBAC | Implemented | `OPS_ANALYST`, `COMPLIANCE_APPROVER`, `ADMIN`; static permission matrix |
| Server-side authorization | Implemented | Single workflow engine (`executeCaseAction()`); locked UI actions still submit and are rejected server-side |
| Audit logging | Implemented | One `AuditEvent` per action, same transaction as the state change; audit screen with filters |
| Shared workflow foundation | Implemented | One status model, transition table, `CaseModule` contract, reused by both modules |
| Shared UI / shell | Implemented | Shell, nav, role switcher, tables, filters, detail layout, action panel, audit table |
| Persistence | Implemented | Prisma on SQLite, deterministic seed |
| Smoke testing | Implemented | 18 engine-level checks (`npm run smoke`), flows A to D |
| Browser validation | Implemented | Flows A to E driven in a recorded run; one table-clipping defect found and fixed (`5975faa`) |
| Entra ID | Not implemented | Provider stub only; demo cookie identity |
| External financial integrations | Not implemented | Synthetic data only |
| CI/CD / production hosting | Not implemented | Local prototype |
| Enterprise security hardening | Not implemented | Plaintext SQLite, unsigned demo cookie; out of PoC scope |
| Regulatory compliance validation | Not measured | Requires production review |

Session evidence: the first working commit was pushed about an hour after the brief was received. This is one observation, not a development rate.

## 3. Reuse Evidence

Counting method: non-blank lines in `*.ts`, `*.tsx`, `*.css`, `*.prisma` under `src/` and `prisma/` at commit `52de7e7` (`rg -c '\S'`), comments included, generated files excluded.

| Code area | Approx. lines | Interpretation |
|---|---:|---|
| Shared foundation | 1,330 | Auth abstraction, authorization, workflow engine, audit, shell, shared UI (28 files) |
| KYC-specific | 158 | Policy, server action, queries, two pages |
| Refund-specific | 196 | Policy (incl. KRW threshold and demo FX conversion), server action, queries, two pages |
| Other | 422 | Overview, audit page, admin, seed data, schema |
| Total `src/` | 2,026 | Reference |

- Shared foundation is about 66% of `src/`; KYC + Refund module-specific code is about 17%.
- Each module also owns one Prisma model (~15 lines), seed rows, six permission strings, and one nav entry.
- Refund reused the existing authorization, workflow engine, audit, UI, shell, filters, notes, and action/reason pattern without modification.

Line counts are architectural evidence that subsequent review-style modules can reuse substantial infrastructure. They are not translated into hours or cost.

## 4. Engineering Leverage

- The first tool carries most of the shared-foundation cost; the foundation here was built as part of the KYC module.
- Subsequent similar tools reuse that foundation. Refund added a policy, a data model, queries, and page declarations, not a second architecture.
- The relevant benefit is lower incremental effort per tool, with **marginal engineering hours per additional application** as the primary metric.
- If shared foundations and Devin-assisted implementation reduce marginal effort, the same engineering organization can support a larger portfolio without effort scaling linearly with application count.
- Released capacity can be redirected toward core fintech product development, reliability, security, integrations, and customer-facing systems. This may also reduce the need for proportional future hiring as the portfolio grows.

The PoC demonstrates this pattern for a second module. It has not been shown at production scale or for the tenth tool.

## 5. Cost and Effort Sensitivity

### Power Apps side

Case assumptions: ~$250K/year, 3 existing applications, at least 10 more planned, potential 13-app portfolio. The case does not provide Power Apps cost at 13 apps, marginal licensing cost per app, licensing terms, or the effort spent building or maintaining the existing apps.

Implied average under a simple linear allocation: $250K / 3 = ~$83K per current application. This is a reference point, not Power Apps pricing.

| Scenario | Illustrative annual spend | Meaning |
|---|---:|---|
| Flat | ~$250K | Spend does not materially increase with app count |
| Moderate | ~$500K | Illustrative midpoint |
| Linear bound | ~$1.08M | $250K / 3 x 13 |

These are sensitivity bounds, not forecasts. Actual cost depends on user vs. app licensing, premium connectors, Dataverse capacity, environments, support, and agreement terms.

### Build side (hours first)

| Scenario | Production foundation | Marginal hours / tool | Maintenance / operations | Interpretation |
|---|---:|---:|---|---|
| Optimistic | 300 h | 60 h | Low | High reuse; review-style tools only |
| Base | 500 h | 100 h | Moderate | Similar review workflows, standard integrations |
| Conservative | 1,000 h | 250 h | High | More integrations, hardening, tools outside the review pattern |

All values are illustrative assumptions. "Production foundation" means Entra ID, managed database, CI/CD, secrets, and hardening of what the PoC sketches. Hours exclude migrating the three existing Power Apps tools and any parallel-running Power Apps spend during transition.

Optional dollar layer, at an illustrative fully loaded $65/hour: one-time effort for a 13-tool portfolio is roughly 1,080 h (~$70K) optimistic, 1,800 h (~$117K) base, 4,250 h (~$276K) conservative, plus illustrative recurring maintenance and operations of ~$60K, ~$85K, and ~$170K per year respectively. This conversion represents the economic value of engineering capacity consumed, not a headcount reduction assumption.

### Break-even framing

The decisive variable is marginal engineering hours per additional application.

- Low marginal hours (tools mostly reuse the foundation) make custom ownership more attractive.
- High marginal hours (bespoke engineering, integration, hardening, operational support per tool) can erase the advantage.
- If Power Apps spend stays near $250K as the portfolio grows, the buy option is harder to beat.
- If Power Apps spend grows materially with the portfolio, the build option becomes more plausible across a wider range of build assumptions.

No break-even point is stated as fact; both marginal hours and Power Apps scaling are unmeasured.

## 6. Power Apps vs. Build

| Dimension | Power Apps / Buy | Devin-Assisted Build | Evidence |
|---|---|---|---|
| Current cost | ~$250K/year for 3 tools | Not measured | Case assumption |
| Future portfolio cost | Unknown; sensitivity only | Unknown; sensitivity only | Illustrative |
| Development model | Managed low-code (canvas/model-driven, Power Fx, connectors) | Code-owned Next.js/TypeScript, Devin-assisted | Documented / observed |
| Reuse | Platform components, solutions, connectors | Shared custom foundation; ~17% module-specific code | Documented / observed |
| Customization | Platform model, custom connectors, PCF | Full source-code control; rules tested by script | Documented / observed |
| Identity | Entra ID integrated | Demo cookie; Entra provider stub | Documented / not implemented |
| Authorization | Dataverse security roles | Server-side permission matrix | Documented / observed (enterprise scale not tested) |
| Auditability | Dataverse auditing, activity logs | Transactional audit rows; append-only by convention | Documented / observed (integrity controls not implemented) |
| Governance and lifecycle | Environments, DLP, solutions, pipelines | Must be built and operated; none in PoC | Documented / not implemented |
| Maintenance ownership | Microsoft platform + customer apps | Customer-owned stack | Structural difference |
| Marginal engineering effort | Not measured | Reuse demonstrated; hours unmeasured | Unknown / observed |
| Production readiness | Managed platform | Prototype only | Documented / not implemented |

The table records the kind of evidence on each side; it does not score or rank the options.

## 7. Decision Interpretation

- The PoC demonstrates that a reusable, code-owned internal-tool foundation with server-side authorization and transactional audit is technically viable.
- The second workflow reused substantial infrastructure, supporting the hypothesis that marginal effort can decrease for similar workflows.
- The economic value should be framed as engineering leverage and portfolio scalability, not headcount reduction.
- The PoC does not establish lower TCO than Power Apps.
- The decision depends mainly on actual marginal engineering hours, maintenance burden, integration complexity, and how Power Apps costs scale from 3 to about 13 applications.

The appropriate next step is a measured pilot with the next 2 to 3 real applications, not adoption.

## 8. What Remains Unproven

| Area | Status |
|---|---|
| Production TCO | Not measured |
| Entra ID integration | Not implemented |
| Real financial-system integration | Not implemented |
| Migration effort from the existing Power Apps estate | Not measured |
| Security hardening | Not implemented |
| Regulatory compliance | Not validated |
| Long-term maintenance burden | Not measured |
| Developer adoption | Not measured |
| Support burden | Not measured |
| Reuse outside review-style workflows | Not tested |

## 9. Recommendation

Run a controlled pilot: build the next 2 to 3 real internal tools from the backlog on this foundation, taken to a production-like environment with Entra ID enabled. Measure:

- engineering hours per application, split into foundation vs. module-specific effort
- production hardening effort
- integration effort against real internal APIs
- maintenance hours and support burden
- defects and incidents
- time to production
- hosting and tooling cost
- actual incremental Power Apps licensing cost, and the same metrics for any comparable Power Apps workflow

The purpose is to determine whether engineering effort grows sub-linearly as the portfolio expands, and to replace the illustrative inputs above with measured values.

The decision should be based on engineering leverage and portfolio scalability, not on an assumption that fewer engineers are required.
