/**
 * Engine-level checks for the Payment Exception Review module, run against the
 * same shared workflow engine as KYC and Refunds. Mirrors scripts/smoke.ts.
 * Run: npm run smoke:payments
 *
 * Resets the demo dataset first.
 */
import { PrismaClient } from "@prisma/client";
import { seedDemoData } from "../src/lib/demo/seed";
import { DEMO_USERS } from "../src/lib/auth/demo-users";
import { hasPermission } from "../src/lib/authz";
import { executeCaseAction } from "../src/lib/workflow/engine";
import { HIGH_VALUE_THRESHOLD_KRW, isHighValue, paymentExceptionModule } from "../src/modules/payments/module";
import { listPaymentExceptions, paymentExceptionSummary } from "../src/modules/payments/queries";
import { prisma } from "../src/lib/db";

const analyst = DEMO_USERS.find((u) => u.role === "OPS_ANALYST")!;
const approver = DEMO_USERS.find((u) => u.role === "COMPLIANCE_APPROVER")!;
const admin = DEMO_USERS.find((u) => u.role === "ADMIN")!;

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

async function main() {
  const seeded = await seedDemoData(new PrismaClient(), { force: true });
  check("Seed: payment exceptions loaded", seeded.seeded && seeded.paymentExceptions === 10, seeded.seeded ? `${seeded.paymentExceptions} rows` : "not seeded");
  const auditBefore = await prisma.auditEvent.count();

  // Policy: threshold and permission mapping
  check("Policy: threshold is exactly KRW 1,000,000 (exclusive)", !isHighValue({ amount: HIGH_VALUE_THRESHOLD_KRW }) && isHighValue({ amount: HIGH_VALUE_THRESHOLD_KRW + 1 }));
  check("Policy: analyst holds payment:approve but not payment:approve_high_value",
    hasPermission("OPS_ANALYST", "payment:approve") && !hasPermission("OPS_ANALYST", "payment:approve_high_value"));
  check("Policy: approver and admin hold payment:approve_high_value",
    hasPermission("COMPLIANCE_APPROVER", "payment:approve_high_value") && hasPermission("ADMIN", "payment:approve_high_value"));

  // Queries: filters
  const byMethod = await listPaymentExceptions({ method: "CARD" });
  check("Query: method filter returns only CARD rows", byMethod.length > 0 && byMethod.every((p) => p.paymentMethod === "CARD"), `${byMethod.length} rows`);
  const byCode = await listPaymentExceptions({ status: "PENDING_REVIEW", code: "DUPLICATE_CAPTURE" });
  check("Query: status + code filter combine", byCode.length === 2 && byCode.every((p) => p.status === "PENDING_REVIEW" && p.exceptionCode === "DUPLICATE_CAPTURE"), `${byCode.length} rows`);
  const summary = await paymentExceptionSummary();
  check("Query: status summary sums to dataset size", Object.values(summary).reduce((a, b) => a + b, 0) === 10, JSON.stringify(summary));

  // Flow P1: analyst on a high-value exception (KRW 3,200,000)
  const high = "PEX-2025-0301";
  const note = await executeCaseAction(paymentExceptionModule, { entityId: high, action: "NOTE", reason: "Merchant confirms retry on their side", user: analyst });
  check("P1: analyst can add note", note.ok);
  const denied = await executeCaseAction(paymentExceptionModule, { entityId: high, action: "APPROVE", reason: "Reverse second capture", user: analyst });
  check("P1: analyst cannot approve exception > KRW 1,000,000", !denied.ok && denied.code === "result.denied", denied.ok ? undefined : denied.error);
  check("P1: exception still PENDING_REVIEW", (await paymentExceptionModule.load(high))!.status === "PENDING_REVIEW");
  const escalate = await executeCaseAction(paymentExceptionModule, { entityId: high, action: "ESCALATE", reason: "Needs compliance sign-off on reversal", user: analyst });
  check("P1: analyst can escalate", escalate.ok);
  check("P1: status is ESCALATED", (await paymentExceptionModule.load(high))!.status === "ESCALATED");

  // Flow P2: analyst resolves a standard-tier exception (KRW 42,000)
  const standard = "PEX-2025-0303";
  const standardOk = await executeCaseAction(paymentExceptionModule, { entityId: standard, action: "APPROVE", reason: "PG confirmed success on manual query", user: analyst });
  check("P2: analyst CAN approve a standard-tier exception", standardOk.ok);
  check("P2: status is APPROVED", (await paymentExceptionModule.load(standard))!.status === "APPROVED");

  // Flow P3: approver resolves the escalated high-value exception
  const approved = await executeCaseAction(paymentExceptionModule, { entityId: high, action: "APPROVE", reason: "Duplicate capture confirmed; reversal authorised", user: approver });
  check("P3: approver can approve high-value exception", approved.ok);
  check("P3: status is APPROVED", (await paymentExceptionModule.load(high))!.status === "APPROVED");
  const audit = await prisma.auditEvent.findFirst({ where: { entityType: "PAYMENT_EXCEPTION", entityId: high, action: "PAYMENT_EXCEPTION_APPROVED" } });
  check("P3: PAYMENT_EXCEPTION_APPROVED audit event persisted with actor/role/states/reason",
    !!audit && audit.actorId === approver.id && audit.actorRole === "COMPLIANCE_APPROVER" && audit.previousState === "ESCALATED" && audit.newState === "APPROVED" && !!audit.reason);
  const reApprove = await executeCaseAction(paymentExceptionModule, { entityId: high, action: "APPROVE", reason: "again", user: admin });
  check("P3: cannot approve an already-approved exception", !reApprove.ok && reApprove.code === "result.badTransition");

  // Flow P4: reject requires a reason; with a reason it succeeds
  const rejectTarget = "PEX-2025-0305";
  const noReason = await executeCaseAction(paymentExceptionModule, { entityId: rejectTarget, action: "REJECT", reason: "", user: approver });
  check("P4: reason required for reject", !noReason.ok && noReason.code === "result.reasonRequired");
  const rejected = await executeCaseAction(paymentExceptionModule, { entityId: rejectTarget, action: "REJECT", reason: "Issuer confirmed card-testing pattern", user: approver });
  check("P4: approver can reject with a reason", rejected.ok);
  const rejectAudit = await prisma.auditEvent.findFirst({ where: { entityType: "PAYMENT_EXCEPTION", entityId: rejectTarget, action: "PAYMENT_EXCEPTION_REJECTED" } });
  check("P4: PAYMENT_EXCEPTION_REJECTED audit event persisted", !!rejectAudit && rejectAudit.newState === "REJECTED");

  const missing = await executeCaseAction(paymentExceptionModule, { entityId: "PEX-9999-0000", action: "NOTE", reason: "x", user: admin });
  check("Unknown exception id is rejected", !missing.ok && missing.code === "result.notFound");

  const auditAfter = await prisma.auditEvent.count();
  check("Every successful action produced exactly one audit row", auditAfter - auditBefore === 5, `${auditAfter - auditBefore} new rows`);

  console.log(failures === 0 ? "\nAll payment smoke checks passed." : `\n${failures} check(s) failed.`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().finally(() => prisma.$disconnect());
