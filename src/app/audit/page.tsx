import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { listAuditActions, listAuditEvents } from "@/lib/audit";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import { AuditTable } from "@/components/shared/AuditTable";
import { FilterBar } from "@/components/shared/FilterBar";
import { AccessDenied, PageHeader } from "@/components/shared/Page";
import { count, getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; action?: string; actorId?: string; entityId?: string }>;
}) {
  const user = await requireUser();
  if (!can(user, "audit:view")) return <AccessDenied required="audit:view" />;
  const params = await searchParams;
  const [events, actions, t] = await Promise.all([listAuditEvents(params), listAuditActions(), getT()]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("audit.title")}
        description={t("audit.description")}
      />
      <FilterBar
        filters={[
          { name: "entityType", label: t("filter.module"), options: ["KYC_CASE", "REFUND", "PAYMENT_EXCEPTION", "SYSTEM"], labels: { KYC_CASE: t("entity.KYC_CASE"), REFUND: t("entity.REFUND"), PAYMENT_EXCEPTION: t("entity.PAYMENT_EXCEPTION"), SYSTEM: t("entity.SYSTEM") } },
          { name: "action", label: t("filter.action"), options: actions, labels: Object.fromEntries(actions.map((a) => [a, a])) },
          { name: "actorId", label: t("filter.actor"), options: DEMO_USERS.map((u) => u.id), labels: Object.fromEntries(DEMO_USERS.map((u) => [u.id, u.name])) },
        ]}
        summary={count(t, events.length, "common.count.event", "common.count.events")}
      />
      <AuditTable events={events} />
    </div>
  );
}
