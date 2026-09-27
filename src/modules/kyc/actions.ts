"use server";

import { handleCaseActionForm } from "@/lib/workflow/action-handler";
import type { ActionResult } from "@/lib/workflow/types";
import { kycModule } from "./module";

export async function kycCaseAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return handleCaseActionForm(kycModule, formData);
}
