import Link from "next/link";
import type { AuditEvent } from "@prisma/client";
import { DataTable, type Column } from "./DataTable";
import { RoleBadge, StatusBadge } from "./StatusBadge";
import { formatDateTime } from "@/lib/format";

const ENTITY_PATHS: Record<string, string> = { KYC_CASE: "/kyc", REFUND: "/refunds" };

export function AuditTable({ events, showEntity = true }: { events: AuditEvent[]; showEntity?: boolean }) {
  const columns: Column<AuditEvent>[] = [
    { key: "ts", header: "When", render: (e) => <span className="whitespace-nowrap text-slate-600">{formatDateTime(e.timestamp)}</span> },
    {
      key: "actor",
      header: "Who",
      render: (e) => (
        <div className="flex flex-col gap-0.5">
          <span>{e.actorName}</span>
          <RoleBadge role={e.actorRole} />
        </div>
      ),
    },
    { key: "action", header: "Action", render: (e) => <span className="whitespace-nowrap font-mono text-xs">{e.action}</span> },
    ...(showEntity
      ? [
          {
            key: "entity",
            header: "On",
            render: (e: AuditEvent) =>
              ENTITY_PATHS[e.entityType] ? (
                <Link href={`${ENTITY_PATHS[e.entityType]}/${e.entityId}`} className="font-mono text-xs text-slate-900 underline">
                  {e.entityId}
                </Link>
              ) : (
                <span className="font-mono text-xs text-slate-500">{e.entityType}</span>
              ),
          },
        ]
      : []),
    {
      key: "change",
      header: "What changed",
      render: (e) =>
        e.previousState && e.newState && e.previousState !== e.newState ? (
          <span className="flex items-center gap-1.5">
            <StatusBadge status={e.previousState} /> → <StatusBadge status={e.newState} />
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    { key: "reason", header: "Why", render: (e) => <span className="text-slate-700">{e.reason ?? "—"}</span>, className: "min-w-48" },
  ];
  return <DataTable columns={columns} rows={events} emptyMessage="No audit events yet." />;
}
