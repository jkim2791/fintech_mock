# PoC Findings

Companion to `README.md`. The README describes what the prototype is; this document records what evidence it produced and how that evidence bears on the Power Apps vs. Devin-assisted build-vs-buy decision.

**Comparison boundary.** This is not a controlled benchmark against Microsoft Power Apps. No equivalent Power Apps implementation of the KYC or Refund workflows exists, and Power Apps time-to-build and engineering effort were not measured. The prototype provides empirical evidence for the custom-build side only.

**Framing.** The economic value of Devin in this case is engineering leverage: enabling an engineering organization to support a larger internal-tool portfolio with lower incremental effort per application.

| Label | Meaning |
|---|---|
| Case assumption | Given by the assignment |
| Observed | Directly supported by the repository or test/session evidence |
| Documented capability | Microsoft capability from documentation |
| Illustrative assumption | Sensitivity input only; not a measurement or forecast |
| Not measured | Not established by this PoC |

## 1. Evaluation Question

Can Devin-assisted custom development reduce the incremental effort of building additional internal tools enough to make code ownership worth considering, compared with continuing to buy a managed platform such as Power Apps?

Case context: a Series C Korean fintech, about 60 engineers, roughly $250K/year on Power Apps for 3 internal tools, with at least 10 more planned.

The central question is how much incremental engineering capacity each additional internal tool requires as the portfolio grows.

## 2. What Was Tested

| Area | Status | Evidence |
|---|---|---|
| KYC Review workflow | Implemented | Queue, filters, detail, masked ID, 14 synthetic cases |
| Refund workflow | Implemented | Queue, filters, detail, KRW 500,000 rule, 11 synthetic refunds |
| Roles / RBAC | Implemented | `OPS_ANALYST`, `COMPLIANCE_APPROVER`, `ADMIN`; static permission matrix |
| Server-side authorization | Implemented | Shared workflow engine via `executeCaseAction()` |
| Audit logging | Implemented | One `AuditEvent` per successful action, written in the same transaction as the state change |
| Shared workflow foundation | Implemented | Shared status model, transition rules, and `CaseModule` contract |
| Shared UI / shell | Implemented | Shell, navigation, role switcher, tables, filters, detail layout, action panel, audit table |
| Persistence | Implemented | Prisma on SQLite with deterministic seed |
| Smoke testing | Implemented | 18 engine-level checks via `npm run smoke` |
| Browser validation | Implemented | Flows A–E exercised; one table-clipping defect found and fixed in `5975faa` |
| Entra ID | Not implemented | Provider stub only; demo cookie identity |
| External financial integrations | Not implemented | Synthetic data only |
| CI/CD / production hosting | Not implemented | Local prototype |
| Enterprise security hardening | Not implemented | Out of PoC scope |
| Regulatory compliance validation | Not measured | Requires production review |

Session evidence: the first working commit was pushed about an hour after the brief was received. This is a single observation, not a development-rate benchmark.

## 3. Reuse Evidence

Counting method: non-blank lines in `*.ts`, `*.tsx`, `*.css`, and `*.prisma` under `src/` and `prisma/` at commit `52de7e7` using `rg -c '\S'`. Comments are included and generated files are excluded.

| Code area | Approx. lines | Interpretation |
|---|---:|---|
| Shared foundation | 1,330 | Auth abstraction, authorization, workflow engine, audit, shell, shared UI |
| KYC-specific | 158 | Policy, server action, queries, two pages |
| Refund-specific | 196 | Policy, threshold logic, server action, queries, two pages |
| Other | 422 | Overview, audit page, admin, seed data, schema |
| Total `src/` | 2,026 | Reference |

- Shared foundation is about 66% of `src/`.
- KYC + Refund module-specific code is about 17%.
- Refund reused the existing authorization, workflow engine, audit, UI, shell, filters, notes, and action/reason patterns without modifying those foundations.

Line counts are architectural evidence that subsequent review-style modules can reuse substantial infrastructure. They are not translated directly into engineering hours or cost savings.

## 4. Engineering Leverage

- The first workflow carries most of the shared-foundation effort.
- Subsequent similar workflows can reuse that foundation rather than recreate the architecture.
- Refund primarily added a policy, data model, queries, and page declarations.
- The key metric is **marginal engineering hours per additional application**.
- If shared foundations and Devin-assisted implementation reduce marginal effort, portfolio growth does not need to produce proportional growth in engineering effort.
- Capacity created through reuse can be redirected toward core fintech product development, reliability, security, integrations, and customer-facing systems.

The PoC demonstrates this pattern for a second module. It has not been validated at production scale or across the full future portfolio.

## 5. Cost and Effort Sensitivity

### Power Apps side

Case assumptions:

- approximately $250K/year
- 3 existing applications
- at least 10 more planned
- potential portfolio of approximately 13 applications

The case does not provide Power Apps cost at 13 applications, marginal licensing cost per additional app, licensing terms, or the engineering effort required to build and maintain the existing applications.

**Implied average under a simple linear allocation:**

$250K / 3 ≈ $83K per current application.

This is a reference point only, not Power Apps pricing.

| Scenario | Illustrative annual spend | Meaning |
|---|---:|---|
| Flat | ~$250K | Spend does not materially increase as applications are added |
| Moderate | ~$500K | Illustrative midpoint |
| Linear bound | ~$1.08M | $250K / 3 × 13 |

These are sensitivity bounds, not forecasts. Actual Power Apps cost can depend on licensing structure, premium connectors, Dataverse capacity, environments, support, and commercial agreement terms.

### Build side — hours first

| Scenario | Production foundation | Marginal hours / tool | Maintenance / operations | Interpretation |
|---|---:|---:|---|---|
| Optimistic | 300 h | 60 h | Low | High reuse across review-style tools |
| Base | 500 h | 100 h | Moderate | Similar workflows with standard integrations |
| Conservative | 1,000 h | 250 h | High | More integration, hardening, or workflow-specific work |

All values are illustrative assumptions.

Production foundation includes items such as Entra ID, a managed database, CI/CD, secrets management, and production hardening.

Hours exclude migration of the three existing Power Apps tools and any period in which both platforms would operate in parallel.

Optional dollar sensitivity at an illustrative fully loaded rate of $65/hour:

- Optimistic: approximately 1,080 engineering hours, or ~$70K one-time
- Base: approximately 1,800 engineering hours, or ~$117K one-time
- Conservative: approximately 4,250 engineering hours, or ~$276K one-time

Illustrative recurring maintenance and operations:

- Optimistic: ~$60K/year
- Base: ~$85K/year
- Conservative: ~$170K/year

The dollar conversion represents the economic value of engineering capacity consumed and is included only as a secondary sensitivity view.

### Break-even framing

The decisive variable is **marginal engineering hours per additional application**.

- Low marginal effort makes custom ownership more economically attractive.
- High marginal effort caused by bespoke workflows, integrations, security hardening, or operational requirements can reduce that advantage.
- If Power Apps spend remains near $250K as the portfolio expands, the Buy option becomes harder to outperform economically.
- If Power Apps spend grows materially with the portfolio, the Build option becomes plausible across a wider range of engineering assumptions.

No break-even point is presented as fact because both marginal engineering effort and future Power Apps scaling remain unmeasured.

## 6. Power Apps vs. Build

| Dimension | Power Apps / Buy | Devin-Assisted Build | Evidence |
|---|---|---|---|
| Current cost | ~$250K/year for 3 tools | Not measured | Case assumption |
| Future portfolio cost | Unknown; sensitivity only | Unknown; sensitivity only | Illustrative |
| Development model | Managed low-code | Code-owned Next.js/TypeScript, Devin-assisted | Documented / observed |
| Reuse | Platform components, solutions, connectors | Shared custom foundation | Documented / observed |
| Customization | Power Fx, custom connectors, PCF | Full source-code control | Documented / observed |
| Identity | Entra ID integrated | Demo cookie; Entra provider stub | Documented / not implemented |
| Authorization | Dataverse security roles | Server-side permission matrix | Documented / observed |
| Auditability | Dataverse auditing and activity logs | Transactional audit rows | Documented / observed |
| Governance / lifecycle | Environments, DLP, solutions, pipelines | Must be built and operated | Documented / not implemented |
| Maintenance ownership | Microsoft platform + customer applications | Customer-owned stack | Structural difference |
| Marginal engineering effort | Not measured | Reuse demonstrated; hours unmeasured | Unknown / observed |
| Production readiness | Managed platform | Prototype only | Documented / not implemented |

The table records the available evidence on each side; it does not score or rank the options.

## 7. Decision Interpretation

- The PoC demonstrates that a reusable, code-owned internal-tool foundation with server-side authorization and transactional audit is technically viable.
- The second workflow reused substantial infrastructure, supporting the hypothesis that marginal effort can decrease across similar workflows.
- The economic value is best evaluated through engineering leverage and portfolio scalability.
- The PoC does not establish lower production TCO than Power Apps.
- The decision depends primarily on actual marginal engineering hours, maintenance burden, integration complexity, and how Power Apps costs scale as the portfolio expands.

The appropriate next step is a measured pilot with the next 2–3 real applications.

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

Run a controlled pilot using the next 2–3 real internal tools from the backlog, taking them into a production-like environment with Entra ID enabled.

Measure:

- engineering hours per application
- foundation vs. module-specific effort
- production hardening effort
- integration effort against real internal APIs
- maintenance hours and support burden
- defects and incidents
- time to production
- hosting and tooling cost
- actual incremental Power Apps licensing cost where available
- equivalent metrics for comparable Power Apps workflows where possible

The objective is to determine whether engineering effort grows sub-linearly as the internal-tool portfolio expands and to replace the illustrative assumptions above with measured values.

The build-vs-buy decision should ultimately be based on engineering leverage, portfolio scalability, operational burden, and measured total cost.
