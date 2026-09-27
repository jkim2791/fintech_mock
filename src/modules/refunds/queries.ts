import { prisma } from "@/lib/db";

export interface RefundFilter {
  status?: string;
  risk?: string;
}

export async function listRefunds(filter: RefundFilter) {
  return prisma.refundCase.findMany({
    where: { status: filter.status || undefined, riskLevel: filter.risk || undefined },
    orderBy: [{ requestedAt: "desc" }],
  });
}

export async function refundSummary() {
  const rows = await prisma.refundCase.groupBy({ by: ["status"], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Record<string, number>;
}
