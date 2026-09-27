"use server";

import { handleCaseActionForm } from "@/lib/workflow/action-handler";
import type { ActionResult } from "@/lib/workflow/types";
import { refundModule } from "./module";

export async function refundAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return handleCaseActionForm(refundModule, formData);
}
