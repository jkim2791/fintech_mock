import type { PrismaClient } from "@prisma/client";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import type { AuthUser } from "@/lib/auth/types";

/** All data below is synthetic. Names, IDs and transactions are fictional. */

const d = (iso: string) => new Date(iso);

const KYC_CASES = [
  { id: "KYC-2025-0101", customerName: "Han So-yeon", idNumber: "930412-2483917", country: "KR", submittedAt: d("2025-09-20T09:12:00+09:00"), riskLevel: "HIGH", status: "PENDING_REVIEW", reviewReason: "PEP screening hit (partial name match)", assignedReviewer: "Park Ji-woo" },
  { id: "KYC-2025-0102", customerName: "Choi Hyun-woo", idNumber: "880723-1932045", country: "KR", submittedAt: d("2025-09-20T11:40:00+09:00"), riskLevel: "LOW", status: "PENDING_REVIEW", reviewReason: "Standard onboarding – ID document check", assignedReviewer: "Park Ji-woo" },
  { id: "KYC-2025-0103", customerName: "Jung Ye-jin", idNumber: "010305-4120398", country: "KR", submittedAt: d("2025-09-21T08:05:00+09:00"), riskLevel: "MEDIUM", status: "PENDING_REVIEW", reviewReason: "Address mismatch between ID and utility bill", assignedReviewer: "Kim Min-seo" },
  { id: "KYC-2025-0104", customerName: "Nguyen Thi Lan", idNumber: "950917-6284730", country: "VN", submittedAt: d("2025-09-21T14:30:00+09:00"), riskLevel: "HIGH", status: "ESCALATED", reviewReason: "Foreign national – source of funds unclear", assignedReviewer: "Kim Min-seo" },
  { id: "KYC-2025-0105", customerName: "Kang Min-jun", idNumber: "790128-1573920", country: "KR", submittedAt: d("2025-09-22T10:00:00+09:00"), riskLevel: "LOW", status: "APPROVED", reviewReason: "Standard onboarding – ID document check", assignedReviewer: "Park Ji-woo" },
  { id: "KYC-2025-0106", customerName: "Yoon Seo-ah", idNumber: "970602-2749183", country: "KR", submittedAt: d("2025-09-22T16:45:00+09:00"), riskLevel: "MEDIUM", status: "PENDING_REVIEW", reviewReason: "Multiple FX purchases above reporting threshold in 30 days", assignedReviewer: "Park Ji-woo" },
  { id: "KYC-2025-0107", customerName: "Tanaka Yuki", idNumber: "860214-5391827", country: "JP", submittedAt: d("2025-09-23T09:20:00+09:00"), riskLevel: "MEDIUM", status: "PENDING_REVIEW", reviewReason: "Non-resident account – enhanced due diligence", assignedReviewer: "Kim Min-seo" },
  { id: "KYC-2025-0108", customerName: "Lim Ji-ho", idNumber: "000811-3928471", country: "KR", submittedAt: d("2025-09-23T13:10:00+09:00"), riskLevel: "LOW", status: "REJECTED", reviewReason: "ID document expired", assignedReviewer: "Park Ji-woo" },
  { id: "KYC-2025-0109", customerName: "Oh Da-eun", idNumber: "910930-2184756", country: "KR", submittedAt: d("2025-09-24T08:50:00+09:00"), riskLevel: "HIGH", status: "PENDING_REVIEW", reviewReason: "Adverse media – suspected mule account network", assignedReviewer: "Kim Min-seo" },
  { id: "KYC-2025-0110", customerName: "Seo Joon-ho", idNumber: "850516-1647392", country: "KR", submittedAt: d("2025-09-24T15:25:00+09:00"), riskLevel: "LOW", status: "PENDING_REVIEW", reviewReason: "Periodic re-verification (3-year cycle)", assignedReviewer: "Park Ji-woo" },
  { id: "KYC-2025-0111", customerName: "Wang Mei", idNumber: "920127-6839204", country: "CN", submittedAt: d("2025-09-25T10:35:00+09:00"), riskLevel: "HIGH", status: "PENDING_REVIEW", reviewReason: "Sanctions list fuzzy match – requires manual clearance", assignedReviewer: "Kim Min-seo" },
  { id: "KYC-2025-0112", customerName: "Bae Su-bin", idNumber: "990404-2593817", country: "KR", submittedAt: d("2025-09-25T17:00:00+09:00"), riskLevel: "MEDIUM", status: "PENDING_REVIEW", reviewReason: "Device fingerprint shared with a closed account", assignedReviewer: "Park Ji-woo" },
  { id: "KYC-2025-0113", customerName: "Shin Woo-jin", idNumber: "830709-1382940", country: "KR", submittedAt: d("2025-09-26T09:00:00+09:00"), riskLevel: "LOW", status: "PENDING_REVIEW", reviewReason: "Standard onboarding – selfie liveness borderline score", assignedReviewer: "Park Ji-woo" },
  { id: "KYC-2025-0114", customerName: "Moon Chae-won", idNumber: "960823-2917463", country: "KR", submittedAt: d("2025-09-26T11:15:00+09:00"), riskLevel: "MEDIUM", status: "ESCALATED", reviewReason: "Occupation declared inconsistent with transaction volume", assignedReviewer: "Kim Min-seo" },
];

const REFUNDS = [
  { id: "REF-2025-0201", transactionId: "TXN-7F3A9C21-KRW", customerName: "Kwon Tae-yang", amount: 1_250_000, currency: "KRW", reason: "Duplicate FX top-up charged twice", riskLevel: "HIGH", status: "PENDING_REVIEW", requestedAt: d("2025-09-22T09:30:00+09:00") },
  { id: "REF-2025-0202", transactionId: "TXN-2B81D4E7-KRW", customerName: "Hwang Ye-eun", amount: 48_000, currency: "KRW", reason: "Merchant cancelled order after settlement", riskLevel: "LOW", status: "PENDING_REVIEW", requestedAt: d("2025-09-22T13:05:00+09:00") },
  { id: "REF-2025-0203", transactionId: "TXN-9C4E1A55-JPY", customerName: "Song Ha-neul", amount: 32_000, currency: "JPY", reason: "ATM withdrawal failed but balance debited", riskLevel: "MEDIUM", status: "PENDING_REVIEW", requestedAt: d("2025-09-23T08:45:00+09:00") },
  { id: "REF-2025-0204", transactionId: "TXN-E13F7B02-KRW", customerName: "Jang Dong-hyun", amount: 780_000, currency: "KRW", reason: "Unauthorized transaction reported by customer", riskLevel: "HIGH", status: "ESCALATED", requestedAt: d("2025-09-23T15:20:00+09:00") },
  { id: "REF-2025-0205", transactionId: "TXN-5A2C88D9-KRW", customerName: "Ryu Si-woo", amount: 15_500, currency: "KRW", reason: "Pricing error on FX spread", riskLevel: "LOW", status: "APPROVED", requestedAt: d("2025-09-24T10:10:00+09:00") },
  { id: "REF-2025-0206", transactionId: "TXN-C7D0E4F1-USD", customerName: "Ahn Ji-a", amount: 640, currency: "USD", reason: "Hotel pre-authorisation not released", riskLevel: "MEDIUM", status: "PENDING_REVIEW", requestedAt: d("2025-09-24T16:40:00+09:00") },
  { id: "REF-2025-0207", transactionId: "TXN-31B9A6C3-KRW", customerName: "Ko Eun-woo", amount: 230_000, currency: "KRW", reason: "Goods not delivered – chargeback pre-empt", riskLevel: "LOW", status: "PENDING_REVIEW", requestedAt: d("2025-09-25T09:00:00+09:00") },
  { id: "REF-2025-0208", transactionId: "TXN-8E6F2D10-KRW", customerName: "Cho Yu-na", amount: 2_400_000, currency: "KRW", reason: "Account takeover – full reversal requested", riskLevel: "HIGH", status: "PENDING_REVIEW", requestedAt: d("2025-09-25T11:55:00+09:00") },
  { id: "REF-2025-0209", transactionId: "TXN-D4A7C9B8-KRW", customerName: "Nam Joon-seo", amount: 99_000, currency: "KRW", reason: "Subscription cancelled within cooling-off period", riskLevel: "LOW", status: "REJECTED", requestedAt: d("2025-09-25T14:30:00+09:00") },
  { id: "REF-2025-0210", transactionId: "TXN-6F1E3B27-EUR", customerName: "Baek Seung-min", amount: 410, currency: "EUR", reason: "Double conversion applied on card purchase", riskLevel: "MEDIUM", status: "PENDING_REVIEW", requestedAt: d("2025-09-26T08:20:00+09:00") },
  { id: "REF-2025-0211", transactionId: "TXN-A9B2C5D6-KRW", customerName: "Im Ha-rin", amount: 505_000, currency: "KRW", reason: "Wrong beneficiary on remittance", riskLevel: "MEDIUM", status: "PENDING_REVIEW", requestedAt: d("2025-09-26T10:05:00+09:00") },
];

const PAYMENT_EXCEPTIONS = [
  { id: "PEX-2025-0301", paymentId: "PAY-4D7A1F93-CARD", customerId: "CUST-00812734", amount: 3_200_000, currency: "KRW", paymentMethod: "CARD", exceptionCode: "DUPLICATE_CAPTURE", exceptionReason: "Two captures for one authorization within 40 seconds; merchant retry suspected", status: "PENDING_REVIEW", occurredAt: d("2025-09-22T08:14:00+09:00") },
  { id: "PEX-2025-0302", paymentId: "PAY-9B2E6C01-VACC", customerId: "CUST-00193847", amount: 185_000, currency: "KRW", paymentMethod: "VIRTUAL_ACCOUNT", exceptionCode: "SETTLEMENT_MISMATCH", exceptionReason: "Deposit received is KRW 5,000 short of invoiced amount", status: "PENDING_REVIEW", occurredAt: d("2025-09-22T10:02:00+09:00") },
  { id: "PEX-2025-0303", paymentId: "PAY-3F8C2A77-WLLT", customerId: "CUST-00458201", amount: 42_000, currency: "KRW", paymentMethod: "MOBILE_WALLET", exceptionCode: "PG_TIMEOUT", exceptionReason: "PG did not return a final status; wallet shows debit", status: "PENDING_REVIEW", occurredAt: d("2025-09-22T13:47:00+09:00") },
  { id: "PEX-2025-0304", paymentId: "PAY-7A1D9E42-BANK", customerId: "CUST-00760915", amount: 1_500_000, currency: "KRW", paymentMethod: "BANK_TRANSFER", exceptionCode: "UNCONFIRMED_DEBIT", exceptionReason: "Customer bank confirms debit; no matching credit in settlement account", status: "ESCALATED", occurredAt: d("2025-09-23T09:30:00+09:00") },
  { id: "PEX-2025-0305", paymentId: "PAY-C5E03B18-CARD", customerId: "CUST-00327764", amount: 96_500, currency: "KRW", paymentMethod: "CARD", exceptionCode: "VELOCITY_LIMIT", exceptionReason: "Seventh card payment in 10 minutes from one device", status: "PENDING_REVIEW", occurredAt: d("2025-09-23T15:12:00+09:00") },
  { id: "PEX-2025-0306", paymentId: "PAY-1E6F4D29-WLLT", customerId: "CUST-00084532", amount: 28_000, currency: "KRW", paymentMethod: "MOBILE_WALLET", exceptionCode: "PG_TIMEOUT", exceptionReason: "Timeout after customer confirmed in app; PG later reported success", status: "APPROVED", occurredAt: d("2025-09-24T08:55:00+09:00") },
  { id: "PEX-2025-0307", paymentId: "PAY-8D2B7C60-VACC", customerId: "CUST-00591278", amount: 760_000, currency: "KRW", paymentMethod: "VIRTUAL_ACCOUNT", exceptionCode: "SETTLEMENT_MISMATCH", exceptionReason: "Deposit made after virtual account expiry", status: "PENDING_REVIEW", occurredAt: d("2025-09-24T11:20:00+09:00") },
  { id: "PEX-2025-0308", paymentId: "PAY-2C9A5F83-CARD", customerId: "CUST-00246139", amount: 2_050_000, currency: "KRW", paymentMethod: "CARD", exceptionCode: "VELOCITY_LIMIT", exceptionReason: "Amount and frequency both above profile; card issuer flagged", status: "PENDING_REVIEW", occurredAt: d("2025-09-25T09:05:00+09:00") },
  { id: "PEX-2025-0309", paymentId: "PAY-6B4E8A17-BANK", customerId: "CUST-00673420", amount: 310_000, currency: "KRW", paymentMethod: "BANK_TRANSFER", exceptionCode: "UNCONFIRMED_DEBIT", exceptionReason: "Customer reports debit; bank reference not found in any statement", status: "REJECTED", occurredAt: d("2025-09-25T14:40:00+09:00") },
  { id: "PEX-2025-0310", paymentId: "PAY-E0F31D54-CARD", customerId: "CUST-00915086", amount: 54_000, currency: "KRW", paymentMethod: "CARD", exceptionCode: "DUPLICATE_CAPTURE", exceptionReason: "Same amount captured twice; second capture carries a new order ID", status: "PENDING_REVIEW", occurredAt: d("2025-09-26T09:50:00+09:00") },
];

const SYSTEM_ACTOR: AuthUser = { id: "system", name: "Seed script", email: "system@localhost", role: "ADMIN", title: "System" };

export async function seedDemoData(prisma: PrismaClient, opts: { force?: boolean; actor?: AuthUser } = {}) {
  const existing = await prisma.user.count();
  if (existing > 0 && !opts.force) return { seeded: false as const };

  const actor = opts.actor ?? SYSTEM_ACTOR;
  await prisma.$transaction([
    prisma.auditEvent.deleteMany(),
    prisma.caseNote.deleteMany(),
    prisma.kycCase.deleteMany(),
    prisma.refundCase.deleteMany(),
    prisma.paymentException.deleteMany(),
    prisma.user.deleteMany(),
    prisma.user.createMany({ data: DEMO_USERS }),
    prisma.kycCase.createMany({ data: KYC_CASES }),
    prisma.refundCase.createMany({ data: REFUNDS }),
    prisma.paymentException.createMany({ data: PAYMENT_EXCEPTIONS }),
    prisma.caseNote.createMany({
      data: [
        { entityType: "KYC_CASE", entityId: "KYC-2025-0104", authorId: "u-analyst", authorName: "Park Ji-woo", authorRole: "OPS_ANALYST", body: "Customer states funds originate from family business in Hanoi; no supporting docs yet." },
        { entityType: "REFUND", entityId: "REF-2025-0204", authorId: "u-analyst", authorName: "Park Ji-woo", authorRole: "OPS_ANALYST", body: "Device used for the disputed transaction differs from the customer's usual device." },
        { entityType: "PAYMENT_EXCEPTION", entityId: "PEX-2025-0304", authorId: "u-analyst", authorName: "Park Ji-woo", authorRole: "OPS_ANALYST", body: "Requested settlement bank trace; expected within two business days." },
      ],
    }),
    prisma.auditEvent.createMany({
      data: [
        { actorId: actor.id, actorName: actor.name, actorRole: actor.role, action: "DEMO_DATA_SEEDED", entityType: "SYSTEM", entityId: "demo", reason: "Synthetic dataset loaded", timestamp: d("2025-09-26T12:00:00+09:00") },
        { actorId: "u-analyst", actorName: "Park Ji-woo", actorRole: "OPS_ANALYST", action: "KYC_CASE_ESCALATED", entityType: "KYC_CASE", entityId: "KYC-2025-0104", previousState: "PENDING_REVIEW", newState: "ESCALATED", reason: "Source of funds documentation missing", timestamp: d("2025-09-22T09:15:00+09:00") },
        { actorId: "u-approver", actorName: "Kim Min-seo", actorRole: "COMPLIANCE_APPROVER", action: "KYC_CASE_APPROVED", entityType: "KYC_CASE", entityId: "KYC-2025-0105", previousState: "PENDING_REVIEW", newState: "APPROVED", reason: "Documents verified, low risk", timestamp: d("2025-09-22T11:30:00+09:00") },
        { actorId: "u-approver", actorName: "Kim Min-seo", actorRole: "COMPLIANCE_APPROVER", action: "KYC_CASE_REJECTED", entityType: "KYC_CASE", entityId: "KYC-2025-0108", previousState: "PENDING_REVIEW", newState: "REJECTED", reason: "Expired ID; customer asked to resubmit", timestamp: d("2025-09-23T14:00:00+09:00") },
        { actorId: "u-analyst", actorName: "Park Ji-woo", actorRole: "OPS_ANALYST", action: "KYC_CASE_ESCALATED", entityType: "KYC_CASE", entityId: "KYC-2025-0114", previousState: "PENDING_REVIEW", newState: "ESCALATED", reason: "Volume inconsistent with declared occupation", timestamp: d("2025-09-26T11:40:00+09:00") },
        { actorId: "u-analyst", actorName: "Park Ji-woo", actorRole: "OPS_ANALYST", action: "REFUND_ESCALATED", entityType: "REFUND", entityId: "REF-2025-0204", previousState: "PENDING_REVIEW", newState: "ESCALATED", reason: "Possible fraud – needs compliance review", timestamp: d("2025-09-23T15:50:00+09:00") },
        { actorId: "u-approver", actorName: "Kim Min-seo", actorRole: "COMPLIANCE_APPROVER", action: "REFUND_APPROVED", entityType: "REFUND", entityId: "REF-2025-0205", previousState: "PENDING_REVIEW", newState: "APPROVED", reason: "Confirmed spread misconfiguration", timestamp: d("2025-09-24T10:40:00+09:00") },
        { actorId: "u-approver", actorName: "Kim Min-seo", actorRole: "COMPLIANCE_APPROVER", action: "REFUND_REJECTED", entityType: "REFUND", entityId: "REF-2025-0209", previousState: "PENDING_REVIEW", newState: "REJECTED", reason: "Cooling-off period had already lapsed", timestamp: d("2025-09-25T15:10:00+09:00") },
        { actorId: "u-analyst", actorName: "Park Ji-woo", actorRole: "OPS_ANALYST", action: "PAYMENT_EXCEPTION_ESCALATED", entityType: "PAYMENT_EXCEPTION", entityId: "PEX-2025-0304", previousState: "PENDING_REVIEW", newState: "ESCALATED", reason: "Above KRW 1,000,000 and funds unaccounted for", timestamp: d("2025-09-23T10:05:00+09:00") },
        { actorId: "u-analyst", actorName: "Park Ji-woo", actorRole: "OPS_ANALYST", action: "PAYMENT_EXCEPTION_APPROVED", entityType: "PAYMENT_EXCEPTION", entityId: "PEX-2025-0306", previousState: "PENDING_REVIEW", newState: "APPROVED", reason: "PG success callback received; ledger reconciled", timestamp: d("2025-09-24T09:30:00+09:00") },
        { actorId: "u-approver", actorName: "Kim Min-seo", actorRole: "COMPLIANCE_APPROVER", action: "PAYMENT_EXCEPTION_REJECTED", entityType: "PAYMENT_EXCEPTION", entityId: "PEX-2025-0309", previousState: "PENDING_REVIEW", newState: "REJECTED", reason: "No debit found at the customer's bank; customer notified", timestamp: d("2025-09-25T16:00:00+09:00") },
      ],
    }),
  ]);

  return { seeded: true as const, kycCases: KYC_CASES.length, refunds: REFUNDS.length, paymentExceptions: PAYMENT_EXCEPTIONS.length, users: DEMO_USERS.length };
}
