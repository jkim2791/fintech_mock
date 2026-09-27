import type { AuthUser } from "@/lib/auth/types";
import { can } from "@/lib/authz";
import { listAuditEvents } from "@/lib/audit";
import { describeActionAvailability } from "@/lib/workflow/engine";
import { listNotes } from "@/lib/workflow/notes";
import type { ActionResult, CaseModule } from "@/lib/workflow/types";
import { formatDateTime } from "@/lib/format";
import { ActionPanel } from "./ActionPanel";
import { AuditTable } from "./AuditTable";
import { DetailPage, type Field } from "./DetailPage";
import { RoleBadge } from "./StatusBadge";
import { Card } from "./Page";

/**
 * Module-agnostic detail screen: field grid + action panel + notes + per-entity
 * audit history. A module supplies its entity, fields and server action.
 */
export async function CaseDetail<T extends { id: string; status: string }>({
  mod,
  entity,
  user,
  fields,
  badges,
  serverAction,
}: {
  mod: CaseModule<T>;
  entity: T;
  user: AuthUser;
  fields: Field[];
  badges?: React.ReactNode;
  serverAction: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
}) {
  const canViewAudit = can(user, "audit:view");
  const [notes, audit] = await Promise.all([
    listNotes(mod.entityType, entity.id),
    canViewAudit ? listAuditEvents({ entityType: mod.entityType, entityId: entity.id }) : Promise.resolve([]),
  ]);
  const availability = describeActionAvailability(mod, entity, user.role);

  return (
    <DetailPage
      backHref={mod.basePath}
      backLabel={`Back to ${mod.label} queue`}
      title={entity.id}
      status={entity.status}
      badges={badges}
      fields={fields}
      side={
        <>
          <ActionPanel key={user.id} entityId={entity.id} availability={availability} serverAction={serverAction} />
          <Card title={`Notes (${notes.length})`}>
            {notes.length === 0 ? (
              <p className="text-sm text-slate-500">No notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="text-sm">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{n.authorName}</span>
                      <RoleBadge role={n.authorRole} />
                      <span>{formatDateTime(n.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-slate-800">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      }
    >
      <section>
        <h2 className="mb-2 text-sm font-medium">Audit history</h2>
        {canViewAudit ? (
          <AuditTable events={audit} showEntity={false} />
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
            Audit history is visible to COMPLIANCE_APPROVER and ADMIN.
          </p>
        )}
      </section>
    </DetailPage>
  );
}
