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
import { Card, SectionHeader } from "./Page";
import { LockIcon } from "./Icons";
import { count, getLocale } from "@/lib/i18n";
import { createTranslator } from "@/lib/i18n/messages";

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
  const locale = await getLocale();
  const t = createTranslator(locale);
  const [notes, audit] = await Promise.all([
    listNotes(mod.entityType, entity.id),
    canViewAudit ? listAuditEvents({ entityType: mod.entityType, entityId: entity.id }) : Promise.resolve([]),
  ]);
  const availability = describeActionAvailability(mod, entity, user.role, t);

  return (
    <DetailPage
      backHref={mod.basePath}
      backLabel={t("detail.backToQueue", { entity: t(`entity.${mod.entityType}`) })}
      title={entity.id}
      status={entity.status}
      badges={badges}
      fields={fields}
      side={
        <>
          <ActionPanel key={user.id} entityId={entity.id} availability={availability} serverAction={serverAction} />
          <Card title={t("detail.notes")} meta={notes.length}>
            {notes.length === 0 ? (
              <p className="text-sm text-slate-500">{t("detail.noNotes")}</p>
            ) : (
              <ol className="divide-y divide-slate-100">
                {notes.map((n) => (
                  <li key={n.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-900">{n.authorName}</span>
                      <RoleBadge role={n.authorRole} />
                      <span className="ml-auto font-mono text-[11px]">{formatDateTime(n.createdAt, locale)}</span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-800">{n.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </>
      }
    >
      <section>
        <SectionHeader title={t("detail.auditHistory")} meta={canViewAudit ? count(t, audit.length, "common.count.event", "common.count.events") : undefined} />
        {canViewAudit ? (
          <AuditTable events={audit} showEntity={false} />
        ) : (
          <p className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-500">
            <LockIcon size={13} />
            {t("detail.auditRestricted")}
          </p>
        )}
      </section>
    </DetailPage>
  );
}
