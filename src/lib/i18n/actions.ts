"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE } from ".";
import { isLocale } from "./messages";

export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) throw new Error("Unsupported locale");
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}
