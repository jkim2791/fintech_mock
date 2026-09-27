"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createTranslator, type Locale, type Translator } from "./messages";
import type { ActionResult } from "@/lib/workflow/types";

interface LocaleContextValue {
  locale: Locale;
  setLocaleOptimistic: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({ locale: "en", setLocaleOptimistic: () => {} });

/**
 * Client-side locale for interactive components. The server-rendered locale is
 * the source of truth; the optimistic setter lets client text flip immediately
 * while the server re-renders after the cookie changes.
 */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [optimistic, setOptimistic] = useState<Locale | null>(null);
  const value = useMemo<LocaleContextValue>(
    () => ({ locale: optimistic ?? locale, setLocaleOptimistic: setOptimistic }),
    [locale, optimistic],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

export function useT(): Translator {
  const { locale } = useLocale();
  return useMemo(() => createTranslator(locale), [locale]);
}

/**
 * Engine results carry a message code plus raw params (entity type, status,
 * action); the display-side translation happens here so the engine stays
 * locale-agnostic.
 */
export function localizeResult(result: ActionResult, t: Translator): string {
  if (!result.code) return result.ok ? result.message : result.error;
  const p = { ...(result.params ?? {}) };
  if (typeof p.entityType === "string") p.entity = t(`entity.${p.entityType}` as Parameters<Translator>[0]);
  if (typeof p.status === "string") p.status = t(`status.${p.status}` as Parameters<Translator>[0]);
  if (typeof p.action === "string") p.action = t(`action.${p.action}` as Parameters<Translator>[0]);
  return t(result.code, p);
}
