# Third Workflow Experiment — Payment Exception Review

## Experiment Goal

Measure the effort required to add a third internal workflow, Payment Exception Review, to the foundation that already supports KYC Review and Refund Operations. The question is how much workflow-specific code and shared-code change a new module needs when the shared authorization, workflow engine, audit, UI and localization layers are reused rather than rebuilt. This record documents what was found, built, changed and verified. It is one observation, not a benchmark.

## Timing

- Start time: [USER TO FILL]
- End time: [USER TO FILL]
- Elapsed wall-clock time: [USER TO FILL]

Wall-clock time is measured from submission of the initial Devin implementation prompt to the final validated working state, including implementation, testing, debugging, and follow-up iterations.

## Investigation

**Existing architecture.** Each workflow is one Prisma model plus a `src/modules/<name>/` directory with three files — `module.ts` (a `CaseModule<T>` policy object), `actions.ts` (a one-function Server Action adapter) and `queries.ts` (list and summary queries) — and two App Router pages (`/<name>` queue, `/<name>/[id]` detail). Everything else is shared.

**Shared components and services identified.**

- Identity and authorization: `requireUser`, `can`, `authorize`, the `PERMISSIONS` list and `ROLE_PERMISSIONS` matrix in `src/lib/authz/permissions.ts`.
- Workflow engine: `executeCaseAction` in `src/lib/workflow/engine.ts` (load → authorize → validate transition → mutate and write one audit row in a single transaction), `TRANSITIONS`, `ACTIONS_REQUIRING_REASON`, and `handleCaseActionForm` for form parsing and revalidation.
- Audit: `recordAudit`, `listAuditEvents`, `EntityType` in `src/lib/audit/index.ts`; `CaseNote` storage via `listNotes`.
- UI: `DataTable`, `FilterBar`, `CaseDetail`, `DetailPage`, `ActionPanel`, `StatusBadge`, `AuditTable`, `MaskedValue`, `AppShell`, `SidebarNav`.
- Localization: `getLocale`/`getT` (server), `useT` (client), EN and KR dictionaries in `src/lib/i18n/messages.ts`.

**Patterns reused from KYC Review and Refund Operations.**

- The `CaseModule` contract: `entityType`, `label`, `basePath`, `load`, `requiredPermission`, `policyNote`, `updateStatus`, `auditAction`.
- The shared status set (`PENDING_REVIEW`, `ESCALATED`, `APPROVED`, `REJECTED`) and action set (`NOTE`, `ESCALATE`, `APPROVE`, `REJECT`) with their transition table.
- The Refund module's two-tier approval rule (standard vs. high-value permission chosen per entity).
- URL-backed queue filters rendered with `FilterBar` and `DataTable`.
- `<entity>:view / note / escalate / approve / approve_high_value / reject` permission naming.

**Architecture decisions.**

- Model the exception as `CaseModule<PaymentException>` so it inherits server-side authorization, transitions, reason validation, notes and transactional audit without new engine code.
- Business rule: any reviewer may resolve (Approve), reject or escalate a standard exception; resolving an exception above KRW 1,000,000 requires `payment:approve_high_value`, held by `COMPLIANCE_APPROVER` and `ADMIN`. This mirrors the refund tier rule. The dataset is KRW-only.
- Build the audit action name from an explicit `Record<CaseAction, string>` map rather than the `action + "D"` concatenation used by the existing modules (see Issues and Iterations).
- Register the new entity at every shared registration point (permissions, `EntityType`, navigation, overview, audit filter, audit link map, dictionaries, seed) instead of adding payment-specific branches elsewhere.
- Add a separate `scripts/smoke-payments.ts` so the existing `scripts/smoke.ts` stays byte-identical and can demonstrate no regression.

## Implementation

**Files created (6).**

| File | Non-blank lines | Purpose |
|---|---|---|
| `src/modules/payments/module.ts` | 54 | `paymentExceptionModule`, `HIGH_VALUE_THRESHOLD_KRW`, `isHighValue`, method and exception-code constants |
| `src/modules/payments/actions.ts` | 9 | Server Action delegating to `handleCaseActionForm` |
| `src/modules/payments/queries.ts` | 19 | `listPaymentExceptions` (status / method / code filter), `paymentExceptionSummary` |
| `src/app/payments/page.tsx` | 91 | Queue with filters, masked payment and customer IDs, amount with approval tier, method, exception reason, status, occurred time |
| `src/app/payments/[id]/page.tsx` | 67 | Detail page with eight fields over shared `CaseDetail` and `ActionPanel` |
| `scripts/smoke-payments.ts` | 93 | Engine-level checks for the new module |

Payment-specific application code (modules + pages, excluding the test script) totals 221 non-blank lines, counted with `grep -c '[^[:space:]]'`.

**Files modified (11).** Line counts are `git diff --numstat ad8a82d 0401302` (added / removed).

| File | +/- | Change |
|---|---|---|
| `prisma/schema.prisma` | +16 / -1 | `PaymentException` model; `CaseNote` entity comment |
| `src/lib/demo/seed.ts` | +20 / -1 | 10 synthetic exceptions `PEX-2025-0301`–`0310`, one note and two audit events, reset handling |
| `prisma/seed.ts` | +1 / -1 | Seed summary line includes payment exceptions |
| `src/lib/authz/permissions.ts` | +14 / -3 | Six `payment:*` permissions; analyst gets view/note/escalate/approve/reject, approver adds `approve_high_value` |
| `src/lib/audit/index.ts` | +1 / -1 | `PAYMENT_EXCEPTION` added to `EntityType` |
| `src/components/shell/AppShell.tsx` | +1 / -0 | "Payment Exceptions" navigation entry |
| `src/app/page.tsx` | +5 / -2 | Third overview card and summary query; grid allows three cards |
| `src/app/audit/page.tsx` | +1 / -1 | Entity filter option |
| `src/components/shared/AuditTable.tsx` | +1 / -1 | `PAYMENT_EXCEPTION → /payments` in the entity link map (fix commit `0401302`) |
| `src/lib/i18n/messages.ts` | +79 / -2 | 60 `payment.*` entries across EN and KR plus shell, filter, count and entity-label strings; dictionary key lines 268 → 324 |
| `package.json` | +2 / -1 | `smoke:payments` script |

**Workflow-specific functionality added.** Queue with status, payment-method and exception-code filters; detail page showing payment ID (masked), customer ID (masked), amount, payment method, approval tier, exception code, exception reason, occurred time and status; Approve (resolve), Reject, Escalate and Add note actions with the high-value rule; EN/KR strings; synthetic seed data; engine-level smoke checks.

**Shared code that required modification.** Only registration points: the permission list and role matrix, the `EntityType` union, navigation, overview, the audit entity filter, the audit link map, the dictionaries and the seed. The workflow engine, action handler, authorization helpers, audit writer, detail/action components and existing KYC and Refund modules were not changed.

**Duplicated logic.** The high-value tier rule (`isHighValue`, threshold constant, `requiredPermission` branch, `policyNote`) is written again in the payment module rather than shared with Refunds. It is a few lines and the thresholds differ (KRW 500,000 for refunds, KRW 1,000,000 here), so it was kept local. No other logic is duplicated.

## Reuse

| Capability | Result | Note |
|---|---|---|
| Authentication / authorization | Reused | `requireUser`, `can`, `authorize` unchanged |
| RBAC / permissions | Modified | Six permissions appended to the list and role matrix; enforcement code unchanged |
| Workflow engine | Reused | `executeCaseAction`, transitions, reason rule and action handler unchanged |
| Audit logging | Modified | One union member and one link-map entry added; writer and queries unchanged |
| Table / filtering UI | Reused | `DataTable`, `FilterBar`, `StatusBadge`, `MaskedValue` |
| Detail / action UI | Reused | `CaseDetail`, `DetailPage`, `ActionPanel`, notes and per-case audit |
| Localization | Modified | Dictionary entries added; `getT`/`useT` and the toggle unchanged |
| Navigation / application shell | Modified | One navigation item and one overview card added |
| Payment-specific domain logic | New | Model, module policy, queries, two pages, seed rows, smoke script |

## Validation

**Tests added.** `scripts/smoke-payments.ts` (`npm run smoke:payments`), 23 checks: seed count, threshold boundary, permission matrix per role, method filter, combined status and code filter, summary counts, analyst note, analyst denied on high-value approve, analyst escalate, analyst standard approve, approver high-value approve, repeated approve rejected as a bad transition, reject without reason rejected, approver reject, exact `PAYMENT_EXCEPTION_REJECTED` audit action, unknown ID, and exactly one audit row per successful action.

**Automated checks at the final commit `0401302`.**

| Check | Command | Result |
|---|---|---|
| Existing engine smoke (KYC + Refund) | `npm run smoke` | 16 PASS, 0 FAIL, "All smoke checks passed." |
| New payment smoke | `npm run smoke:payments` | 23 PASS, 0 FAIL, "All payment smoke checks passed." |
| Lint | `npm run lint` | exit 0 |
| Typecheck | `npm run typecheck` | exit 0 |
| Routes | `curl` against the dev server | `/`, `/kyc`, `/kyc/KYC-2025-0101`, `/refunds`, `/refunds/REF-2025-0201`, `/payments`, `/payments/PEX-2025-0301`, `/audit`, `/admin` all HTTP 200; `/audit` and `/admin` render "Access denied" for the analyst |

**End-to-end browser verification** (recorded run at commit `ab94801`, Chrome against the local dev server):

- Queue shows 10 exceptions; Method = Card returns `PEX-2025-0301`, `0305`, `0308`, `0310`; Card + Duplicate capture returns `0301`, `0310`; Status = Escalated returns `0304`; clearing filters restores 10 rows.
- Analyst: Approve on a high-value exception denied server-side with the role/permission message; Escalate succeeds; Approve on a standard exception succeeds; Add note persists.
- Approver: Approve on a high-value exception succeeds; Reject with reason succeeds and the global audit log shows `PAYMENT_EXCEPTION_REJECTED`.
- Global audit log filtered to Payment exceptions showed 8 events in that run.
- Korean queue and detail labels render without missing glyphs.
- Regression: KYC analyst denial and approver approval, Refund high-value denial and approval still behave as before.
- Defect found: payment rows in the global audit log showed the entity type but no case link (see below).

After the fix commit, the audit link was verified against the running server rather than in a new recorded browser run: the HTML of `/audit?entityType=PAYMENT_EXCEPTION` and of the overview's recent-audit panel contain `href="/payments/PEX-2025-03xx"` for every payment row, matching the existing KYC and Refund links.

**Final state: pass.** All automated checks pass at `0401302`; the browser-found defect is fixed and verified by server response.

## Issues and Iterations

**1. New smoke test failed on the audit action name.**
What failed: `P4: PAYMENT_EXCEPTION_REJECTED audit event persisted` in the first run of `smoke-payments.ts` (22 PASS, 1 FAIL).
Detection: the new test asserts the exact audit action string after a successful Reject.
Cause: the payment module initially copied the existing modules' `action === "NOTE" ? "NOTE_ADDED" : action + "D"` expression, which yields `REJECTD`.
Change: replaced with an explicit `AUDIT_SUFFIX` map in `src/modules/payments/module.ts`.
Outcome: 23 PASS. The same expression still exists in `src/modules/kyc/module.ts` and `src/modules/refunds/module.ts`, so a live Reject there records `KYC_CASE_REJECTD` / `REFUND_REJECTD` while seed rows use `_REJECTED`. The existing `smoke.ts` never exercises a successful Reject, which is why it did not catch this. The pre-existing modules were deliberately left unchanged in this experiment and the finding was reported to the user; the one-line fix is pending a decision.

**2. Payment rows in the global audit log had no case link.**
What failed: `/audit` and the overview recent-audit panel showed `PAYMENT_EXCEPTION` without the case ID link that KYC and Refund rows have.
Detection: recorded browser run.
Cause: `AuditTable.tsx` resolves links through a hard-coded `ENTITY_PATHS` map that only listed `KYC_CASE` and `REFUND` — a registration point missed during implementation.
Change: added `PAYMENT_EXCEPTION: "/payments"` (commit `0401302`).
Outcome: links present in server-rendered HTML for every payment audit row; lint and typecheck pass.

**3. Hydration-mismatch overlay during browser testing (not an application change).**
A recoverable Next.js hydration warning appeared on direct loads of two payment detail pages during the browser run. The captured diff shows only `devinid="…"` and `devin-tagname="…"` attributes being removed, which are injected into the DOM by the browser-automation harness, and the server-rendered HTML for the same URL contains no such attributes. The page remained fully usable. No code was changed for this; it is recorded here because it appeared in the run, with the cause attributed to the test instrumentation rather than to the application, based on the diff content.

## Git Evidence

| Role | Commit | Message |
|---|---|---|
| Baseline | `ad8a82d` | POC_FINDINGS: rejoin sentence split by the previous edit |
| Implementation | `ab94801` | Add Payment Exception Review as a third CaseModule workflow |
| Fix (audit link) | `0401302` | Link payment exception audit rows to their detail page |
| Final experiment commit | `cc763b7` | Add THIRD_WORKFLOW_EXPERIMENT.md: evidence record for Payment Exception Review |

Range: https://github.com/jkim2791/fintech_mock/compare/ad8a82d...main

## Conclusion

The third workflow was added and all checks pass. The authentication/authorization helpers, the workflow engine and action handler, the audit writer, the table, filter, detail and action components, the localization runtime and the application shell were reused without modification. Shared code changed only at registration points — permission list, entity-type union, navigation, overview, audit filter and link map, dictionaries, seed — for a total of 11 modified files, most by one to a few lines; the largest were the dictionaries (+79) and the seed data (+20). Workflow-specific work was the Prisma model, a 54-line policy module, a 19-line query module, a 9-line action adapter, two pages (158 lines together), seed rows and a 93-line smoke script.

Two issues arose and both were caught by testing rather than by review: one in the new test (which also exposed a latent bug in the two existing modules) and one missed registration point found only in the browser. Within this one experiment the marginal engineering effort of a new workflow was concentrated in domain-specific policy, data and presentation, plus registering the entity in a known set of shared places. This is a single observation on a small synthetic workflow; it does not establish how long future workflows will take or what a production build would cost.
