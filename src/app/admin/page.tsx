import { requireUser } from "@/lib/auth";
import { can, PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/authz";
import { ROLES } from "@/lib/auth/types";
import { AccessDenied, Card, PageHeader } from "@/components/shared/Page";
import { CheckIcon } from "@/components/shared/Icons";
import { ResetButton } from "./ResetButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireUser();
  if (!can(user, "admin:access")) return <AccessDenied required="admin:access" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Administration" description="Demo-only administrative functions." />
      <Card title="Demo data">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-lg text-sm leading-relaxed text-slate-600">
            Reloads the synthetic dataset and clears notes and audit history. The reset itself is written to the audit log.
          </p>
          <ResetButton />
        </div>
      </Card>
      <Card title="Role → permission matrix" meta="Source of truth for every server-side check">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <th className="pb-2 font-medium">Permission</th>
              {ROLES.map((r) => (
                <th key={r} className="pb-2 text-center font-mono text-[11px] normal-case tracking-normal">
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PERMISSIONS.map((p) => (
              <tr key={p}>
                <td className="py-2 font-mono text-xs text-slate-800">{p}</td>
                {ROLES.map((r) => (
                  <td key={r} className="py-2 text-center">
                    {ROLE_PERMISSIONS[r].has(p) ? (
                      <CheckIcon size={14} strokeWidth={2} className="mx-auto text-emerald-600" />
                    ) : (
                      <span className="mx-auto block h-px w-2.5 bg-slate-300" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
