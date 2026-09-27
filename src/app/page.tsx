import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PERMISSIONS, can } from "@/lib/authz";
import { kycSummary } from "@/modules/kyc/queries";
import { refundSummary } from "@/modules/refunds/queries";
import { listAuditEvents } from "@/lib/audit";
import { Card, PageHeader } from "@/components/shared/Page";
import { AuditTable } from "@/components/shared/AuditTable";
import { REVIEW_STATUSES } from "@/lib/workflow/types";
import { humanize } from "@/lib/format";

export const dynamic = "force-dynamic";

function Summary({ title, href, counts }: { title: string; href: string; counts: Record<string, number> }) {
  return (
    <Card title={title}>
      <div className="grid grid-cols-4 gap-3">
        {REVIEW_STATUSES.map((s) => (
          <Link key={s} href={`${href}?status=${s}`} className="rounded-md bg-slate-50 px-3 py-2 hover:bg-slate-100">
            <div className="text-2xl font-semibold tabular-nums">{counts[s] ?? 0}</div>
            <div className="text-xs text-slate-500">{humanize(s)}</div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export default async function Overview() {
  const user = await requireUser();
  const [kyc, refunds, recent] = await Promise.all([
    kycSummary(),
    refundSummary(),
    can(user, "audit:view") ? listAuditEvents({ limit: 8 }) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Two internal tools (KYC Review, Refund Operations) built on one shared foundation: shell, auth, authorization, workflow engine, audit."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {can(user, "kyc:view") && <Summary title="KYC Review" href="/kyc" counts={kyc} />}
        {can(user, "refund:view") && <Summary title="Refund Operations" href="/refunds" counts={refunds} />}
      </div>
      <Card title={`Effective permissions for ${user.role}`}>
        <div className="flex flex-wrap gap-1.5">
          {PERMISSIONS.map((p) => (
            <span
              key={p}
              className={`rounded px-2 py-0.5 font-mono text-xs ${
                can(user, p) ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-400 line-through"
              }`}
            >
              {p}
            </span>
          ))}
        </div>
      </Card>
      {can(user, "audit:view") && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium">Recent audit events</h2>
            <Link href="/audit" className="text-xs text-slate-500 underline">
              Full audit log
            </Link>
          </div>
          <AuditTable events={recent} />
        </section>
      )}
    </div>
  );
}
