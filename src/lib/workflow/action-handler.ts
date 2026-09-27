import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { executeCaseAction } from "./engine";
import { isCaseAction, type ActionResult, type CaseModule } from "./types";

/**
 * Adapter from a <form> submission to the engine. Each module exposes a
 * one-line server action that delegates here.
 */
export async function handleCaseActionForm<T extends { id: string; status: string }>(
  mod: CaseModule<T>,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const entityId = String(formData.get("entityId") ?? "");
  const action = String(formData.get("action") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (!entityId || !isCaseAction(action)) return { ok: false, error: "Invalid request." };

  const result = await executeCaseAction(mod, { entityId, action, reason, user });
  if (result.ok) {
    revalidatePath(mod.basePath);
    revalidatePath(`${mod.basePath}/${entityId}`);
    revalidatePath("/audit");
    revalidatePath("/");
  }
  return result;
}
