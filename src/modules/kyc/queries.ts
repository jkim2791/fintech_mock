import { prisma } from "@/lib/db";

export interface KycFilter {
  status?: string;
  risk?: string;
}

export async function listKycCases(filter: KycFilter) {
  return prisma.kycCase.findMany({
    where: { status: filter.status || undefined, riskLevel: filter.risk || undefined },
    orderBy: [{ submittedAt: "desc" }],
  });
}

export async function kycSummary() {
  const rows = await prisma.kycCase.groupBy({ by: ["status"], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Record<string, number>;
}
