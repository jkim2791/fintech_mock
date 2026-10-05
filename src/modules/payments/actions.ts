"use server";

import { handleCaseActionForm } from "@/lib/workflow/action-handler";
import type { ActionResult } from "@/lib/workflow/types";
import { paymentExceptionModule } from "./module";

export async function paymentExceptionAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return handleCaseActionForm(paymentExceptionModule, formData);
}
