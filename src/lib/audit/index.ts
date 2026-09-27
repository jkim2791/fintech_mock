import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/auth/types";

export type EntityType = "KYC_CASE" | "REFUND" | "SYSTEM";

export interface AuditInput {
  actor: AuthUser;
  action: string;
  entityType: EntityType;
  entityId: string;
  previousState?: string | null;
  newState?: string | null;
  reason?: string | null;
}

type Db = Prisma.TransactionClient | typeof prisma;

/** Append one audit event. Pass the transaction client so the state change and its audit row commit together. */
export async function recordAudit(input: AuditInput, db: Db = prisma) {
  return db.auditEvent.create({
    data: {
      actorId: input.actor.id,
      actorName: input.actor.name,
      actorRole: input.actor.role,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      previousState: input.previousState ?? null,
      newState: input.newState ?? null,
      reason: input.reason ?? null,
    },
  });
}

export interface AuditFilter {
  entityType?: string;
  entityId?: string;
  action?: string;
  actorId?: string;
  limit?: number;
}

export async function listAuditEvents(filter: AuditFilter = {}) {
  return prisma.auditEvent.findMany({
    where: {
      entityType: filter.entityType || undefined,
      entityId: filter.entityId || undefined,
      action: filter.action || undefined,
      actorId: filter.actorId || undefined,
    },
    orderBy: { timestamp: "desc" },
    take: filter.limit ?? 200,
  });
}

export async function listAuditActions(): Promise<string[]> {
  const rows = await prisma.auditEvent.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } });
  return rows.map((r) => r.action);
}
