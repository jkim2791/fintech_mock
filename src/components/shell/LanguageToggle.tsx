"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n/messages";
import { setLocale } from "@/lib/i18n/actions";
import { useLocale, useT } from "@/lib/i18n/client";

const LABEL: Record<Locale, string> = { en: "EN", ko: "KR" };

/** Segmented EN / KR control; mirrors the role switcher's interaction model. */
export function LanguageToggle() {
  const { locale, setLocaleOptimistic } = useLocale();
  const t = useT();
  const [pending, start] = useTransition();
  const router = useRouter();

  function select(next: Locale) {
    if (next === locale) return;
    setLocaleOptimistic(next);
    start(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("shell.language")}
      className={`inline-flex h-8 items-center rounded-md border border-slate-200 bg-white p-0.5 ${pending ? "opacity-60" : ""}`}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={active}
            lang={l}
            onClick={() => select(l)}
            className={`h-full rounded-[5px] px-2 text-xs tracking-wide transition-colors ${
              active ? "bg-slate-900 font-medium text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {LABEL[l]}
          </button>
        );
      })}
    </div>
  );
}
