import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authz";
import { listAuditActions, listAuditEvents } from "@/lib/audit";
import { DEMO_USERS } from "@/lib/auth/demo-users";
import { AuditTable } from "@/components/shared/AuditTable";
import { FilterBar } from "@/components/shared/FilterBar";
import { AccessDenied, PageHeader } from "@/components/shared/Page";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; action?: string; actorId?: string; entityId?: string }>;
}) {
  const user = await requireUser();
  if (!can(user, "audit:view")) return <AccessDenied required="audit:view" />;
  const params = await searchParams;
  const [events, actions] = await Promise.all([listAuditEvents(params), listAuditActions()]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Audit Log"
        description="Append-only record of every privileged workflow action across all modules: who, what, when, on which case, and why."
      />
      <FilterBar
        filters={[
          { name: "entityType", label: "Module", options: ["KYC_CASE", "REFUND", "SYSTEM"] },
          { name: "action", label: "Action", options: actions },
          { name: "actorId", label: "Actor", options: DEMO_USERS.map((u) => u.id) },
        ]}
      />
      <AuditTable events={events} />
    </div>
  );
}
