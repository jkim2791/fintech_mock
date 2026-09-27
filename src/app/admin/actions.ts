"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { authorize } from "@/lib/authz";
import { recordAudit } from "@/lib/audit";
import { seedDemoData } from "@/lib/demo/seed";

export async function resetDemoData(): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  authorize(user, "admin:access");
  await seedDemoData(prisma, { force: true, actor: user });
  await recordAudit({ actor: user, action: "DEMO_DATA_RESET", entityType: "SYSTEM", entityId: "demo", reason: "Administrator reset the synthetic dataset" });
  revalidatePath("/", "layout");
  return { ok: true, message: "Demo data reset." };
}
