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

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(d);
}

export function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(d) + " KST";
}

export function humanize(value: string): string {
  return value.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/** Same as formatDateTime but split into [date, time] for stacked table cells. */
export function splitDateTime(d: Date): [string, string] {
  const full = formatDateTime(d);
  const idx = full.indexOf(", ");
  return idx === -1 ? [full, ""] : [full.slice(0, idx), full.slice(idx + 2)];
}
