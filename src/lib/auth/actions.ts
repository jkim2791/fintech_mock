"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isDemoMode } from ".";
import { DEMO_USER_COOKIE } from "./demo-provider";
import { DEMO_USERS } from "./demo-users";

export async function switchDemoUser(userId: string): Promise<void> {
  if (!isDemoMode()) throw new Error("User switching is only available in DEMO_MODE");
  if (!DEMO_USERS.some((u) => u.id === userId)) throw new Error("Unknown demo user");
  const store = await cookies();
  store.set(DEMO_USER_COOKIE, userId, { path: "/", sameSite: "lax", httpOnly: true });
  revalidatePath("/", "layout");
}
