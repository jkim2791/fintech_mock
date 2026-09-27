import Link from "next/link";
import type { AuditEvent } from "@prisma/client";
import { DataTable, type Column } from "./DataTable";
import { RoleBadge, StatusBadge } from "./StatusBadge";
import { ArrowRightIcon } from "./Icons";
import { splitDateTime } from "@/lib/format";
import { getLocale } from "@/lib/i18n";
import { createTranslator } from "@/lib/i18n/messages";

const ENTITY_PATHS: Record<string, string> = { KYC_CASE: "/kyc", REFUND: "/refunds" };

export async function AuditTable({ events, showEntity = true }: { events: AuditEvent[]; showEntity?: boolean }) {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const columns: Column<AuditEvent>[] = [
    {
      key: "ts",
      header: t("audit.col.when"),
      render: (e) => {
        const [date, time] = splitDateTime(e.timestamp, locale);
        return (
          <span className="flex flex-col whitespace-nowrap font-mono text-xs leading-tight">
            <span className="text-slate-900">{date}</span>
            <span className="text-slate-500">{time}</span>
          </span>
        );
      },
    },
    {
      key: "actor",
      header: t("audit.col.who"),
      render: (e) => (
        <span className="flex flex-col items-start gap-0.5">
          <span className="whitespace-nowrap text-slate-900">{e.actorName}</span>
          <RoleBadge role={e.actorRole} />
        </span>
      ),
    },
    {
      key: "action",
      header: t("audit.col.action"),
      render: (e) => <span className="whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-800">{e.action}</span>,
    },
    ...(showEntity
      ? [
          {
            key: "entity",
            header: t("audit.col.on"),
            render: (e: AuditEvent) =>
              ENTITY_PATHS[e.entityType] ? (
                <Link href={`${ENTITY_PATHS[e.entityType]}/${e.entityId}`} className="whitespace-nowrap font-mono text-xs text-slate-900 hover:underline">
                  {e.entityId}
                </Link>
              ) : (
                <span className="whitespace-nowrap font-mono text-xs text-slate-500">{e.entityType === "SYSTEM" ? t("entity.SYSTEM") : e.entityType}</span>
              ),
          },
        ]
      : []),
    {
      key: "change",
      header: t("audit.col.change"),
      render: (e) =>
        e.previousState && e.newState && e.previousState !== e.newState ? (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <StatusBadge status={e.previousState} />
            <ArrowRightIcon size={12} className="text-slate-400" />
            <StatusBadge status={e.newState} />
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      key: "reason",
      header: t("audit.col.why"),
      render: (e) => <span className="block max-w-md text-[13px] leading-snug text-slate-700">{e.reason ?? "—"}</span>,
      className: "min-w-48",
    },
  ];
  return <DataTable columns={columns} rows={events} emptyMessage={t("audit.empty")} />;
}
