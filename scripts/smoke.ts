/**
 * Exercises the shared workflow engine directly (no browser) to prove the
 * authorization and audit guarantees for demo flows A–D. Run: npm run smoke
 * Resets the demo dataset first.
 */
import { PrismaClient } from "@prisma/client";
import { seedDemoData } from "../src/lib/demo/seed";
import { DEMO_USERS } from "../src/lib/auth/demo-users";
import { executeCaseAction } from "../src/lib/workflow/engine";
import { kycModule } from "../src/modules/kyc/module";
import { refundModule } from "../src/modules/refunds/module";
import { prisma } from "../src/lib/db";

const analyst = DEMO_USERS.find((u) => u.role === "OPS_ANALYST")!;
const approver = DEMO_USERS.find((u) => u.role === "COMPLIANCE_APPROVER")!;

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

async function main() {
  await seedDemoData(new PrismaClient(), { force: true });
  const auditBefore = await prisma.auditEvent.count();

  // Flow A: analyst on a HIGH-risk KYC case
  const highKyc = "KYC-2025-0101";
  const note = await executeCaseAction(kycModule, { entityId: highKyc, action: "NOTE", reason: "Checked PEP list manually", user: analyst });
  check("A: analyst can add note", note.ok);
  const approveDenied = await executeCaseAction(kycModule, { entityId: highKyc, action: "APPROVE", reason: "Looks fine", user: analyst });
  check("A: analyst cannot approve HIGH-risk KYC", !approveDenied.ok, approveDenied.ok ? undefined : approveDenied.error);
  const escalate = await executeCaseAction(kycModule, { entityId: highKyc, action: "ESCALATE", reason: "Needs compliance sign-off", user: analyst });
  check("A: analyst can escalate", escalate.ok);
  check("A: status is ESCALATED", (await kycModule.load(highKyc))!.status === "ESCALATED");

  const lowOk = await executeCaseAction(kycModule, { entityId: "KYC-2025-0102", action: "APPROVE", reason: "Documents verified", user: analyst });
  check("A: analyst CAN approve a LOW-risk KYC case (standard tier)", lowOk.ok);

  // Flow B: approver approves the same HIGH-risk case
  const approved = await executeCaseAction(kycModule, { entityId: highKyc, action: "APPROVE", reason: "PEP match cleared; false positive", user: approver });
  check("B: approver can approve HIGH-risk KYC", approved.ok);
  check("B: status is APPROVED", (await kycModule.load(highKyc))!.status === "APPROVED");
  const kycAudit = await prisma.auditEvent.findFirst({ where: { entityType: "KYC_CASE", entityId: highKyc, action: "KYC_CASE_APPROVED" } });
  check("B: KYC_CASE_APPROVED audit event persisted with actor/role/reason",
    !!kycAudit && kycAudit.actorId === approver.id && kycAudit.actorRole === "COMPLIANCE_APPROVER" && kycAudit.previousState === "ESCALATED" && kycAudit.newState === "APPROVED" && !!kycAudit.reason);
  const reApprove = await executeCaseAction(kycModule, { entityId: highKyc, action: "APPROVE", reason: "again", user: approver });
  check("B: cannot approve an already-approved case", !reApprove.ok);

  // Flow C: analyst on a refund > KRW 500,000
  const bigRefund = "REF-2025-0201";
  const refundDenied = await executeCaseAction(refundModule, { entityId: bigRefund, action: "APPROVE", reason: "Customer verified", user: analyst });
  check("C: analyst cannot approve refund > KRW 500,000", !refundDenied.ok, refundDenied.ok ? undefined : refundDenied.error);
  check("C: refund still PENDING_REVIEW", (await refundModule.load(bigRefund))!.status === "PENDING_REVIEW");

  // Flow D: approver approves it
  const refundOk = await executeCaseAction(refundModule, { entityId: bigRefund, action: "APPROVE", reason: "Duplicate charge confirmed in ledger", user: approver });
  check("D: approver can approve high-value refund", refundOk.ok);
  check("D: refund status APPROVED", (await refundModule.load(bigRefund))!.status === "APPROVED");
  const refundAudit = await prisma.auditEvent.findFirst({ where: { entityType: "REFUND", entityId: bigRefund, action: "REFUND_APPROVED" } });
  check("D: REFUND_APPROVED audit event persisted", !!refundAudit && refundAudit.actorId === approver.id && refundAudit.newState === "APPROVED");

  // Reason is mandatory for privileged actions
  const noReason = await executeCaseAction(refundModule, { entityId: "REF-2025-0202", action: "REJECT", reason: "", user: approver });
  check("Reason required for reject", !noReason.ok);

  const auditAfter = await prisma.auditEvent.count();
  check("Every successful action produced exactly one audit row", auditAfter - auditBefore === 5, `${auditAfter - auditBefore} new rows`);

  console.log(failures === 0 ? "\nAll smoke checks passed." : `\n${failures} check(s) failed.`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().finally(() => prisma.$disconnect());
