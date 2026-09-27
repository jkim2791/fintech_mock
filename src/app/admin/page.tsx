import { requireUser } from "@/lib/auth";
import { can, PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/authz";
import { ROLES } from "@/lib/auth/types";
import { AccessDenied, Card, PageHeader } from "@/components/shared/Page";
import { ResetButton } from "./ResetButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireUser();
  if (!can(user, "admin:access")) return <AccessDenied required="admin:access" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Administration" description="Demo-only administrative functions." />
      <Card title="Demo data">
        <p className="mb-3 text-sm text-slate-600">Reloads the synthetic dataset and clears notes and audit history. The reset itself is audited.</p>
        <ResetButton />
      </Card>
      <Card title="Role → permission matrix">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-1.5">Permission</th>
              {ROLES.map((r) => (
                <th key={r} className="py-1.5 text-center">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PERMISSIONS.map((p) => (
              <tr key={p}>
                <td className="py-1.5 font-mono text-xs">{p}</td>
                {ROLES.map((r) => (
                  <td key={r} className="py-1.5 text-center">{ROLE_PERMISSIONS[r].has(p) ? "●" : <span className="text-slate-300">–</span>}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
