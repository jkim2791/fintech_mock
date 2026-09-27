import type { Locale } from "@/lib/i18n/messages";

/** Mask a synthetic Korean RRN-style identifier (YYMMDD-GXXXXXX) → YYMMDD-G******. */
export function maskIdNumber(value: string): string {
  const [front, back] = value.split("-");
  if (!back) return value.slice(0, 2) + "*".repeat(Math.max(0, value.length - 2));
  return `${front}-${back.slice(0, 1)}${"*".repeat(back.length - 1)}`;
}

/** Mask a transaction reference keeping only the tail (e.g. TXN-…9C21-KRW). */
export function maskReference(value: string, visible = 8): string {
  if (value.length <= visible) return value;
  return `${value.slice(0, 4)}…${value.slice(-visible)}`;
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

const DATE_LOCALE: Record<Locale, string> = { en: "en-GB", ko: "ko-KR" };

export function formatDate(d: Date, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(d);
}

function formatTime(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], { timeStyle: "short", timeZone: "Asia/Seoul" }).format(d);
}

export function formatDateTime(d: Date, locale: Locale = "en"): string {
  return `${formatDate(d, locale)}${locale === "ko" ? " " : ", "}${formatTime(d, locale)} KST`;
}

export function humanize(value: string): string {
  return value.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/** Same as formatDateTime but split into [date, time] for stacked table cells. */
export function splitDateTime(d: Date, locale: Locale = "en"): [string, string] {
  return [formatDate(d, locale), `${formatTime(d, locale)} KST`];
}
