import type { ReactNode } from "react";
import { getT } from "@/lib/i18n";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  align?: "left" | "right";
}

/** Generic read-only table used by every queue / log screen. */
export async function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  emptyMessage,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
}) {
  const t = await getT();
  const empty = emptyMessage ?? t("common.noRecords");
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 first:pl-4 last:pr-4 ${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-slate-500">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="group hover:bg-slate-50/80">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-3 py-2.5 align-middle first:pl-4 last:pr-4 ${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
