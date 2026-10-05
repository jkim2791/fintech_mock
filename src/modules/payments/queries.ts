import { prisma } from "@/lib/db";

export interface PaymentExceptionFilter {
  status?: string;
  method?: string;
  code?: string;
}

export async function listPaymentExceptions(filter: PaymentExceptionFilter) {
  return prisma.paymentException.findMany({
    where: { status: filter.status || undefined, paymentMethod: filter.method || undefined, exceptionCode: filter.code || undefined },
    orderBy: [{ occurredAt: "desc" }],
  });
}

export async function paymentExceptionSummary() {
  const rows = await prisma.paymentException.groupBy({ by: ["status"], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Record<string, number>;
}
