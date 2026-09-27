import { cookies } from "next/headers";
import { createTranslator, DEFAULT_LOCALE, isLocale, type Locale, type Translator } from "./messages";

export * from "./messages";

export const LOCALE_COOKIE = "lang";

/** Request-scoped locale; defaults to English when no preference is stored. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value ?? "";
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

export async function getT(): Promise<Translator> {
  return createTranslator(await getLocale());
}
