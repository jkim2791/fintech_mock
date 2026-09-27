import { prisma } from "@/lib/db";
import type { EntityType } from "@/lib/audit";

export async function listNotes(entityType: EntityType, entityId: string) {
  return prisma.caseNote.findMany({ where: { entityType, entityId }, orderBy: { createdAt: "desc" } });
}
